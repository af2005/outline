import invariant from "invariant";
import { concat, find, last } from "lodash";
import { computed, action } from "mobx";
import Blog from "~/models/Blog";
import { NavigationNode } from "~/types";
import { client } from "~/utils/ApiClient";
import { AuthorizationError, NotFoundError } from "~/utils/errors";
import BaseStore from "./BaseStore";
import RootStore from "./RootStore";

enum DocumentPathItemType {
  Blog = "blog",
  Document = "document",
}

export type DocumentPathItem = {
  type: DocumentPathItemType;
  id: string;
  blogId: string;
  title: string;
  url: string;
};

export type DocumentPath = DocumentPathItem & {
  path: DocumentPathItem[];
};

export default class BlogsStore extends BaseStore<Blog> {
  constructor(rootStore: RootStore) {
    super(rootStore, Blog);
  }

  @computed
  get active(): Blog | null | undefined {
    return this.rootStore.ui.activeBlogId
      ? this.data.get(this.rootStore.ui.activeBlogId)
      : undefined;
  }

  @computed
  get orderedData(): Blog[] {
    let blogs = Array.from(this.data.values());
    blogs = blogs.filter((blog) => (blog.deletedAt ? false : true));
    return blogs.sort((a, b) => {
      if (a.index === b.index) {
        return a.updatedAt > b.updatedAt ? -1 : 1;
      }

      return a.index < b.index ? -1 : 1;
    });
  }

  /**
   * List of paths to each of the documents, where paths are composed of id and title/name pairs
   */
  @computed
  get pathsToDocuments(): DocumentPath[] {
    const results: DocumentPathItem[][] = [];

    const travelDocuments = (
      documentList: NavigationNode[],
      blogId: string,
      path: DocumentPathItem[]
    ) =>
      documentList.forEach((document: NavigationNode) => {
        const { id, title, url } = document;
        const node = {
          type: DocumentPathItemType.Document,
          id,
          blogId,
          title,
          url,
        };
        results.push(concat(path, node));
        travelDocuments(document.children, blogId, concat(path, [node]));
      });

    if (this.isLoaded) {
      this.data.forEach((blog) => {
        const { id, name, url } = blog;
        const node = {
          type: DocumentPathItemType.Blog,
          id,
          blogId: id,
          title: name,
          url,
        };
        results.push([node]);
        travelDocuments(blog.documents, id, [node]);
      });
    }

    return results.map((result) => {
      const tail = last(result) as DocumentPathItem;
      return { ...tail, path: result };
    });
  }

  @action
  import = async (attachmentId: string, format?: string) => {
    await client.post("/blogs.import", {
      type: "outline",
      format,
      attachmentId,
    });
  };

  @action
  move = async (blogId: string, index: string) => {
    const res = await client.post("/blogs.move", {
      id: blogId,
      index,
    });
    invariant(res?.success, "Blog could not be moved");
    const blog = this.get(blogId);

    if (blog) {
      blog.updateIndex(res.data.index);
    }
  };

  async update(params: Record<string, any>): Promise<Blog> {
    const result = await super.update(params);

    // If we're changing sharing permissions on the blog then we need to
    // remove all locally cached policies for documents in the blog as they
    // are now invalid
    if (params.sharing !== undefined) {
      const blog = this.get(params.id);

      if (blog) {
        blog.documentIds.forEach((id) => {
          this.rootStore.policies.remove(id);
        });
      }
    }

    return result;
  }

  @action
  async fetch(id: string, options: Record<string, any> = {}): Promise<Blog> {
    const item = this.get(id) || this.getByUrl(id);
    if (item && !options.force) {
      return item;
    }
    this.isFetching = true;

    try {
      const res = await client.post(`/blogs.info`, {
        id,
      });
      invariant(res?.data, "Blog not available");
      this.addPolicies(res.policies);
      return this.add(res.data);
    } catch (err) {
      if (err instanceof AuthorizationError || err instanceof NotFoundError) {
        this.remove(id);
      }

      throw err;
    } finally {
      this.isFetching = false;
    }
  }

  @computed
  get publicBlogs() {
    return this.orderedData.filter((blog) =>
      ["read", "read_write"].includes(blog.permission || "")
    );
  }

  star = async (blog: Blog) => {
    await this.rootStore.stars.create({
      blogId: blog.id,
    });
  };

  unstar = async (blog: Blog) => {
    const star = this.rootStore.stars.orderedData.find(
      (star) => star.blogId === blog.id
    );
    await star?.delete();
  };

  getPathForDocument(documentId: string): DocumentPath | undefined {
    return this.pathsToDocuments.find((path) => path.id === documentId);
  }

  titleForDocument(documentUrl: string): string | undefined {
    const path = this.pathsToDocuments.find((path) => path.url === documentUrl);
    if (path) {
      return path.title;
    }

    return;
  }

  getByUrl(url: string): Blog | null | undefined {
    return find(this.orderedData, (col: Blog) => url.endsWith(col.urlId));
  }

  delete = async (blog: Blog) => {
    await super.delete(blog);
    this.rootStore.documents.fetchRecentlyUpdated();
    this.rootStore.documents.fetchRecentlyViewed();
  };

  export = () => {
    return client.post("/blogs.export_all");
  };
}
