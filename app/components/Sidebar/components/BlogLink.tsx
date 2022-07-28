import { Location } from "history";
import { observer } from "mobx-react";
import { PlusIcon } from "outline-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import Blog from "~/models/Blog";
import Document from "~/models/Document";
import BlogIcon from "~/components/BlogIcon";
import Fade from "~/components/Fade";
import NudeButton from "~/components/NudeButton";
import { createDocument } from "~/actions/definitions/documents";
import useActionContext from "~/hooks/useActionContext";
import useBoolean from "~/hooks/useBoolean";
import usePolicy from "~/hooks/usePolicy";
import useStores from "~/hooks/useStores";
import BlogMenu from "~/menus/BlogMenu";
import { NavigationNode } from "~/types";
import DropToImport from "./DropToImport";
import EditableTitle from "./EditableTitle";
import Relative from "./Relative";
import SidebarLink, { DragObject } from "./SidebarLink";
import { useStarredContext } from "./StarredContext";

type Props = {
  blog: Blog;
  expanded?: boolean;
  onDisclosureClick: (ev: React.MouseEvent<HTMLButtonElement>) => void;
  activeDocument: Document | undefined;
  isDraggingAnyBlog?: boolean;
};

const BlogLink: React.FC<Props> = ({
  blog,
  expanded,
  onDisclosureClick,
  isDraggingAnyBlog,
}) => {
  const [menuOpen, handleMenuOpen, handleMenuClose] = useBoolean();
  const [isEditing, setIsEditing] = React.useState(false);
  const canUpdate = usePolicy(blog.id).update;
  const { t } = useTranslation();
  const history = useHistory();
  const inStarredSection = useStarredContext();

  const handleTitleChange = React.useCallback(
    async (name: string) => {
      await blog.save({
        name,
      });
      history.replace(blog.url, history.location.state);
    },
    [blog, history]
  );

  //TODO Drag and drop blogs

  const handleTitleEditing = React.useCallback((isEditing: boolean) => {
    setIsEditing(isEditing);
  }, []);

  const context = useActionContext({
    //TODO for blogs
    activeCollectionId: blog.id,
    inStarredSection,
  });

  return (
    <>
      <Relative>
        <SidebarLink
          to={{
            pathname: blog.url,
            state: { starred: inStarredSection },
          }}
          expanded={expanded}
          onDisclosureClick={onDisclosureClick}
          icon={<BlogIcon blog={blog} expanded={expanded} />}
          showActions={menuOpen}
          isActive={(match, location: Location<{ starred?: boolean }>) =>
            !!match && location.state?.starred === inStarredSection
          }
          label={
            <EditableTitle
              title={blog.name}
              onSubmit={handleTitleChange}
              onEditing={handleTitleEditing}
              canUpdate={canUpdate}
            />
          }
          exact={false}
          depth={0}
          menu={
            !isEditing &&
            !isDraggingAnyBlog && (
              <Fade>
                <NudeButton
                  tooltip={{ tooltip: t("New doc"), delay: 500 }}
                  action={createDocument}
                  context={context}
                  hideOnActionDisabled
                >
                  <PlusIcon />
                </NudeButton>
                <BlogMenu
                  blog={blog}
                  onOpen={handleMenuOpen}
                  onClose={handleMenuClose}
                />
              </Fade>
            )
          }
        />
      </Relative>
    </>
  );
};

export default observer(BlogLink);
