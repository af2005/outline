import {
  CalendarIcon,
  EditIcon,
  PlusIcon,
  StarredIcon,
  UnstarredIcon,
} from "outline-icons";
import * as React from "react";
import stores from "~/stores";
import Blog from "~/models/Blog";
import BlogEdit from "~/scenes/BlogEdit";
import BlogNew from "~/scenes/BlogNew";
import DynamicBlogIcon from "~/components/BlogIcon";
import { createAction } from "~/actions";
import { BlogSection } from "~/actions/sections";
import history from "~/utils/history";

const ColorBlogIcon = ({ blog }: { blog: Blog }) => {
  return <DynamicBlogIcon blog={blog} />;
};

export const openBlog = createAction({
  name: ({ t }) => t("Open blog"),
  section: BlogSection,
  shortcut: ["o", "c"],
  icon: <CalendarIcon />,
  children: ({ stores }) => {
    const blogs = stores.blogs.orderedData;
    return blogs.map((blog) => ({
      // Note: using url which includes the slug rather than id here to bust
      // cache if the blog is renamed
      id: blog.url,
      name: blog.name,
      icon: <ColorBlogIcon blog={blog} />,
      section: BlogSection,
      perform: () => history.push(blog.url),
    }));
  },
});

export const createBlog = createAction({
  name: ({ t }) => t("New blog"),
  section: BlogSection,
  icon: <PlusIcon />,
  keywords: "create",
  visible: ({ stores }) =>
    stores.policies.abilities(stores.auth.team?.id || "").createBlog,
  perform: ({ t, event }) => {
    event?.preventDefault();
    event?.stopPropagation();
    stores.dialogs.openModal({
      title: t("Create a blog"),
      content: <BlogNew onSubmit={stores.dialogs.closeAllModals} />,
    });
  },
});

export const editBlog = createAction({
  name: ({ t }) => t("Edit blog"),
  section: BlogSection,
  icon: <EditIcon />,
  visible: ({ stores, activeBlogId }) =>
    !!activeBlogId && stores.policies.abilities(activeBlogId).update,
  perform: ({ t, activeBlogId }) => {
    if (!activeBlogId) {
      return;
    }

    stores.dialogs.openModal({
      title: t("Edit blog"),
      content: (
        <BlogEdit
          onSubmit={stores.dialogs.closeAllModals}
          blogId={activeBlogId}
        />
      ),
    });
  },
});

export const starBlog = createAction({
  name: ({ t }) => t("Star"),
  section: BlogSection,
  icon: <StarredIcon />,
  keywords: "favorite bookmark",
  visible: ({ activeBlogId, stores }) => {
    if (!activeBlogId) {
      return false;
    }
    const blog = stores.blogs.get(activeBlogId);
    return !blog?.isStarred && stores.policies.abilities(activeBlogId).star;
  },
  perform: ({ activeBlogId, stores }) => {
    if (!activeBlogId) {
      return;
    }

    const blog = stores.blogs.get(activeBlogId);
    blog?.star();
  },
});

export const unstarBlog = createAction({
  name: ({ t }) => t("Unstar"),
  section: BlogSection,
  icon: <UnstarredIcon />,
  keywords: "unfavorite unbookmark",
  visible: ({ activeBlogId, stores }) => {
    if (!activeBlogId) {
      return false;
    }
    const blog = stores.blogs.get(activeBlogId);
    return !!blog?.isStarred && stores.policies.abilities(activeBlogId).unstar;
  },
  perform: ({ activeBlogId, stores }) => {
    if (!activeBlogId) {
      return;
    }

    const blog = stores.blogs.get(activeBlogId);
    blog?.unstar();
  },
});

export const rootBlogActions = [openBlog, createBlog, starBlog, unstarBlog];
