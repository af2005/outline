import fractionalIndex from "fractional-index";
import { observer } from "mobx-react";
import * as React from "react";
import { useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import Blog from "~/models/Blog";
import Flex from "~/components/Flex";
import Error from "~/components/List/Error";
import PaginatedList from "~/components/PaginatedList";
import { createBlog } from "~/actions/definitions/blogs";
import useStores from "~/hooks/useStores";
import DraggableBlogLink from "./DraggableBlogLink";
import DropCursor from "./DropCursor";
import Header from "./Header";
import PlaceholderBlogs from "./PlaceholderBlogs";
import Relative from "./Relative";
import SidebarAction from "./SidebarAction";
import { DragObject } from "./SidebarLink";

function Blogs() {
  const { documents, blogs } = useStores();
  const { t } = useTranslation();
  const orderedBlogs = blogs.orderedData;

  const [{ isBlogDropping, isDraggingAnyBlog }, dropToReorderBlog] = useDrop({
    accept: "blog",
    drop: async (item: DragObject) => {
      blogs.move(item.id, fractionalIndex(null, orderedBlogs[0].index));
    },
    canDrop: (item) => {
      return item.id !== orderedBlogs[0].id;
    },
    collect: (monitor) => ({
      isBlogDropping: monitor.isOver(),
      isDraggingAnyBlog: monitor.getItemType() === "blog",
    }),
  });

  return (
    <Flex column>
      <Header id="blogs" title={t("Blogs")}>
        <Relative>
          <PaginatedList
            aria-label={t("Blogs")}
            items={blogs.orderedData}
            fetch={blogs.fetchPage}
            options={{ limit: 100 }}
            loading={<PlaceholderBlogs />}
            heading={
              isDraggingAnyBlog ? (
                <DropCursor
                  isActiveDrop={isBlogDropping}
                  innerRef={dropToReorderBlog}
                  position="top"
                />
              ) : undefined
            }
            renderError={(props) => <StyledError {...props} />}
            renderItem={(item: Blog, index) => (
              <DraggableBlogLink
                key={item.id}
                blog={item}
                activeDocument={documents.active}
                prefetchDocument={documents.prefetchDocument}
                belowBlog={orderedBlogs[index + 1]}
              />
            )}
          />
          <SidebarAction action={createBlog} depth={0} />
        </Relative>
      </Header>
    </Flex>
  );
}

const StyledError = styled(Error)`
  font-size: 15px;
  padding: 0 8px;
`;

export default observer(Blogs);
