import { observer } from "mobx-react";
import { MoreIcon, PlusIcon } from "outline-icons";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Blog from "~/models/Blog";
import { Action, Separator } from "~/components/Actions";
import Button from "~/components/Button";
import InputSearchPage from "~/components/InputSearchPage";
import Tooltip from "~/components/Tooltip";
import usePolicy from "~/hooks/usePolicy";
import BlogMenu from "~/menus/BlogMenu";
import { newDocumentPath } from "~/utils/routeHelpers";

type Props = {
  blog: Blog;
};

function Actions({ blog }: Props) {
  const { t } = useTranslation();
  const can = usePolicy(blog.id);

  return (
    <>
      {!blog.isEmpty && (
        <>
          <Action>
            <InputSearchPage
              source="blog"
              placeholder={`${t("Search in blog")}…`}
              label={`${t("Search in blog")}…`}
              blogId={blog.id}
            />
          </Action>
          {can.update && (
            <>
              <Action>
                <Tooltip
                  tooltip={t("New document")}
                  shortcut="n"
                  delay={500}
                  placement="bottom"
                >
                  <Button
                    as={Link}
                    to={blog ? newDocumentPath(blog.id) : ""}
                    disabled={!blog}
                    icon={<PlusIcon />}
                  >
                    {t("New doc")}
                  </Button>
                </Tooltip>
              </Action>
              <Separator />
            </>
          )}
        </>
      )}
      <Action>
        <BlogMenu
          blog={blog}
          placement="bottom-end"
          label={(props) => (
            <Button
              aria-label={t("Blog menu")}
              icon={<MoreIcon />}
              {...props}
              borderOnHover
              neutral
              small
            />
          )}
        />
      </Action>
    </>
  );
}

export default observer(Actions);
