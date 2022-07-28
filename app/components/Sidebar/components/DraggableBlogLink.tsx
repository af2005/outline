import fractionalIndex from "fractional-index";
import { observer } from "mobx-react";
import * as React from "react";
import { useDrop, useDrag, DropTargetMonitor } from "react-dnd";
import { useLocation } from "react-router-dom";
import styled from "styled-components";
import Blog from "~/models/Blog";
import Document from "~/models/Document";
import usePolicy from "~/hooks/usePolicy";
import useStores from "~/hooks/useStores";
import BlogLink from "./BlogLink";
import BlogLinkChildren from "./BlogLinkChildren";
import DropCursor from "./DropCursor";
import Relative from "./Relative";
import { DragObject } from "./SidebarLink";

type Props = {
  blog: Blog;
  activeDocument: Document | undefined;
  prefetchDocument: (id: string) => Promise<Document | void>;
  belowBlog: Blog | void;
};

function useLocationStateStarred() {
  const location = useLocation<{
    starred?: boolean;
  }>();
  return location.state?.starred;
}

function DraggableBlogLink({
  blog,
  activeDocument,
  prefetchDocument,
  belowBlog,
}: Props) {
  const locationStateStarred = useLocationStateStarred();
  const { ui, blogs } = useStores();
  const [expanded, setExpanded] = React.useState(
    blog.id === ui.activeBlogId && !locationStateStarred
  );
  const can = usePolicy(blog.id);
  const belowBlogIndex = belowBlog ? belowBlog.index : null;

  // Drop to reorder blog
  const [{ isBlogDropping, isDraggingAnyBlog }, dropToReorderBlog] = useDrop({
    accept: "blog",
    drop: (item: DragObject) => {
      blogs.move(item.id, fractionalIndex(blog.index, belowBlogIndex));
    },
    canDrop: (item) => {
      return blog.id !== item.id && (!belowBlog || item.id !== belowBlog.id);
    },
    collect: (monitor: DropTargetMonitor<Blog, Blog>) => ({
      isBlogDropping: monitor.isOver(),
      isDraggingAnyBlog: monitor.getItemType() === "blog",
    }),
  });

  // Drag to reorder blog
  const [{ isBlogDragging }, dragToReorderBlog] = useDrag({
    type: "blog",
    item: () => {
      return {
        id: blog.id,
      };
    },
    collect: (monitor) => ({
      isBlogDragging: monitor.isDragging(),
    }),
    canDrag: () => {
      return can.move;
    },
  });

  // If the current blog is active and relevant to the sidebar section we
  // are in then expand it automatically
  React.useEffect(() => {
    if (blog.id === ui.activeBlogId && !locationStateStarred) {
      setExpanded(true);
    }
  }, [blog.id, ui.activeBlogId, locationStateStarred]);

  const handleDisclosureClick = React.useCallback((ev) => {
    ev.preventDefault();
    setExpanded((e) => !e);
  }, []);

  const displayChildDocuments = expanded && !isBlogDragging;

  return (
    <>
      <Draggable
        key={blog.id}
        ref={dragToReorderBlog}
        $isDragging={isBlogDragging}
      >
        <BlogLink
          blog={blog}
          expanded={displayChildDocuments}
          activeDocument={activeDocument}
          onDisclosureClick={handleDisclosureClick}
          isDraggingAnyBlog={isDraggingAnyBlog}
        />
      </Draggable>
      <Relative>
        <BlogLinkChildren
          blog={blog}
          expanded={displayChildDocuments}
          prefetchDocument={prefetchDocument}
        />
        {isDraggingAnyBlog && (
          <DropCursor
            isActiveDrop={isBlogDropping}
            innerRef={dropToReorderBlog}
          />
        )}
      </Relative>
    </>
  );
}

const Draggable = styled("div")<{ $isDragging: boolean }>`
  opacity: ${(props) => (props.$isDragging ? 0.5 : 1)};
  pointer-events: ${(props) => (props.$isDragging ? "none" : "auto")};
`;

export default observer(DraggableBlogLink);
