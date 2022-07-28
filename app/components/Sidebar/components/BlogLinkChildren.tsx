import { observer } from "mobx-react";
import * as React from "react";
import Blog from "~/models/Blog";
import Document from "~/models/Document";
import useStores from "~/hooks/useStores";
import DocumentLink from "./DocumentLink";
import EmptyBlogPlaceholder from "./EmptyBlogPlaceholder";
import Folder from "./Folder";
import useBlogDocuments from "./useBlogDocuments";

type Props = {
  blog: Blog;
  expanded: boolean;
  prefetchDocument?: (documentId: string) => Promise<Document | void>;
};

function BlogLinkChildren({ blog, expanded, prefetchDocument }: Props) {
  const { documents } = useStores();

  const childDocuments = useBlogDocuments(blog, documents.active);


  return (
    <Folder expanded={expanded}>
      {childDocuments.map((node, index) => (
        <DocumentLink
          key={node.id}
          node={node}
          blog={blog}
          activeDocument={documents.active}
          prefetchDocument={prefetchDocument}
          isDraft={node.isDraft}
          depth={2}
          index={index}
        />
      ))}
      {childDocuments.length === 0 && <EmptyBlogPlaceholder />}
    </Folder>
  );
}

export default observer(BlogLinkChildren);
