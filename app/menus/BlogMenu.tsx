import { observer } from "mobx-react";
import {
  NewDocumentIcon,
  EditIcon,
  TrashIcon,
  ImportIcon,
  ExportIcon,
  PadlockIcon,
  AlphabeticalSortIcon,
  ManualSortIcon,
  UnstarredIcon,
  StarredIcon,
} from "outline-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useHistory } from "react-router-dom";
import { useMenuState, MenuButton, MenuButtonHTMLProps } from "reakit/Menu";
import { VisuallyHidden } from "reakit/VisuallyHidden";
import { getEventFiles } from "@shared/utils/files";
import Blog from "~/models/Blog";
import BlogEdit from "~/scenes/BlogEdit";
import BlogExport from "~/scenes/BlogExport";
import BlogPermissions from "~/scenes/BlogPermissions";
import BlogDeleteDialog from "~/components/BlogDeleteDialog";
import ContextMenu, { Placement } from "~/components/ContextMenu";
import OverflowMenuButton from "~/components/ContextMenu/OverflowMenuButton";
import Template from "~/components/ContextMenu/Template";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import usePolicy from "~/hooks/usePolicy";
import useStores from "~/hooks/useStores";
import useToasts from "~/hooks/useToasts";
import { MenuItem } from "~/types";
import { newDocumentPath } from "~/utils/routeHelpers";

type Props = {
  blog: Blog;
  placement?: Placement;
  modal?: boolean;
  label?: (props: MenuButtonHTMLProps) => React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
};

function BlogMenu({
  blog,
  label,
  modal = true,
  placement,
  onOpen,
  onClose,
}: Props) {
  const menu = useMenuState({
    modal,
    placement,
  });
  const team = useCurrentTeam();
  const { documents, dialogs } = useStores();
  const { showToast } = useToasts();
  const { t } = useTranslation();
  const history = useHistory();
  const file = React.useRef<HTMLInputElement>(null);

  const handlePermissions = React.useCallback(() => {
    dialogs.openModal({
      title: t("Blog permissions"),
      content: <BlogPermissions blog={blog} />,
    });
  }, [blog, dialogs, t]);

  const handleEdit = React.useCallback(() => {
    dialogs.openModal({
      title: t("Edit blog"),
      content: <BlogEdit blogId={blog.id} onSubmit={dialogs.closeAllModals} />,
    });
  }, [blog.id, dialogs, t]);

  const handleExport = React.useCallback(() => {
    dialogs.openModal({
      title: t("Export blog"),
      content: <BlogExport blog={blog} onSubmit={dialogs.closeAllModals} />,
    });
  }, [blog, dialogs, t]);

  const handleNewDocument = React.useCallback(
    (ev: React.SyntheticEvent) => {
      ev.preventDefault();
      history.push(newDocumentPath(blog.id));
    },
    [history, blog.id]
  );

  const stopPropagation = React.useCallback((ev: React.SyntheticEvent) => {
    ev.stopPropagation();
  }, []);

  const handleImportDocument = React.useCallback(
    (ev: React.SyntheticEvent) => {
      ev.preventDefault();
      ev.stopPropagation();

      // simulate a click on the file upload input element
      if (file.current) {
        file.current.click();
      }
    },
    [file]
  );

  const handleFilePicked = React.useCallback(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      const files = getEventFiles(ev);

      // Because this is the onChange handler it's possible for the change to be
      // from previously selecting a file to not selecting a file – aka empty
      if (!files.length) {
        return;
      }

      try {
        const file = files[0];
        const document = await documents.import(file, null, blog.id, {
          publish: true,
        });
        history.push(document.url);
      } catch (err) {
        showToast(err.message, {
          type: "error",
        });
        throw err;
      }
    },
    [history, showToast, blog.id, documents]
  );

  const handleChangeSort = React.useCallback(
    (field: string) => {
      menu.hide();
      return blog.save({
        sort: {
          field,
          direction: "asc",
        },
      });
    },
    [blog, menu]
  );

  const handleDelete = React.useCallback(() => {
    dialogs.openModal({
      isCentered: true,
      title: t("Delete blog"),
      content: (
        <BlogDeleteDialog blog={blog} onSubmit={dialogs.closeAllModals} />
      ),
    });
  }, [dialogs, t, blog]);

  const handleStar = React.useCallback(
    (ev: React.SyntheticEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      blog.star();
    },
    [blog]
  );

  const handleUnstar = React.useCallback(
    (ev: React.SyntheticEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      blog.unstar();
    },
    [blog]
  );

  const alphabeticalSort = blog.sort.field === "title";
  const can = usePolicy(blog.id);
  const canUserInTeam = usePolicy(team.id);
  const items: MenuItem[] = React.useMemo(
    () => [
      {
        type: "button",
        title: t("Unstar"),
        onClick: handleUnstar,
        visible: blog.isStarred && !!can.unstar,
        icon: <UnstarredIcon />,
      },
      {
        type: "button",
        title: t("Star"),
        onClick: handleStar,
        visible: !blog.isStarred && !!can.star,
        icon: <StarredIcon />,
      },
      {
        type: "separator",
      },
      {
        type: "button",
        title: t("New document"),
        visible: can.update,
        onClick: handleNewDocument,
        icon: <NewDocumentIcon />,
      },
      {
        type: "button",
        title: t("Import document"),
        visible: can.update,
        onClick: handleImportDocument,
        icon: <ImportIcon />,
      },
      {
        type: "separator",
      },
      {
        type: "submenu",
        title: t("Sort in sidebar"),
        visible: can.update,
        icon: alphabeticalSort ? (
          <AlphabeticalSortIcon color="currentColor" />
        ) : (
          <ManualSortIcon color="currentColor" />
        ),
        items: [
          {
            type: "button",
            title: t("Alphabetical sort"),
            onClick: () => handleChangeSort("title"),
            selected: alphabeticalSort,
          },
          {
            type: "button",
            title: t("Manual sort"),
            onClick: () => handleChangeSort("index"),
            selected: !alphabeticalSort,
          },
        ],
      },
      {
        type: "button",
        title: `${t("Edit")}…`,
        visible: can.update,
        onClick: handleEdit,
        icon: <EditIcon />,
      },
      {
        type: "button",
        title: `${t("Permissions")}…`,
        visible: can.update,
        onClick: handlePermissions,
        icon: <PadlockIcon />,
      },
      {
        type: "button",
        title: `${t("Export")}…`,
        visible: !!(blog && canUserInTeam.createExport),
        onClick: handleExport,
        icon: <ExportIcon />,
      },
      {
        type: "separator",
      },
      {
        type: "button",
        title: `${t("Delete")}…`,
        dangerous: true,
        visible: !!(blog && can.delete),
        onClick: handleDelete,
        icon: <TrashIcon />,
      },
    ],
    [
      t,
      handleUnstar,
      blog,
      can.unstar,
      can.star,
      can.update,
      can.delete,
      handleStar,
      handleNewDocument,
      handleImportDocument,
      alphabeticalSort,
      handleEdit,
      handlePermissions,
      canUserInTeam.createExport,
      handleExport,
      handleDelete,
      handleChangeSort,
    ]
  );

  if (!items.length) {
    return null;
  }

  return (
    <>
      <VisuallyHidden>
        <label>
          {t("Import document")}
          <input
            type="file"
            ref={file}
            onChange={handleFilePicked}
            onClick={stopPropagation}
            accept={documents.importFileTypes.join(", ")}
            tabIndex={-1}
          />
        </label>
      </VisuallyHidden>
      {label ? (
        <MenuButton {...menu}>{label}</MenuButton>
      ) : (
        <OverflowMenuButton aria-label={t("Show menu")} {...menu} />
      )}
      <ContextMenu
        {...menu}
        onOpen={onOpen}
        onClose={onClose}
        aria-label={t("Blog")}
      >
        <Template {...menu} items={items} />
      </ContextMenu>
    </>
  );
}

export default observer(BlogMenu);
