import { observer } from "mobx-react";
import { NewDocumentIcon } from "outline-icons";
import * as React from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import styled from "styled-components";
import Blog from "~/models/Blog";
import BlogPermissions from "~/scenes/BlogPermissions";
import Button from "~/components/Button";
import Flex from "~/components/Flex";
import Modal from "~/components/Modal";
import Text from "~/components/Text";
import useBoolean from "~/hooks/useBoolean";
import usePolicy from "~/hooks/usePolicy";
import { newDocumentPath } from "~/utils/routeHelpers";

type Props = {
  blog: Blog;
};

function EmptyBlog({ blog }: Props) {
  const { t } = useTranslation();
  const can = usePolicy(blog.id);
  const blogName = blog ? blog.name : "";

  const [
    permissionsModalOpen,
    handlePermissionsModalOpen,
    handlePermissionsModalClose,
  ] = useBoolean();

  return (
    <Centered column>
      <Text type="secondary">
        <Trans
          defaults="<em>{{ blogName }}</em> doesn’t contain any
                    documents yet."
          values={{
            blogName,
          }}
          components={{
            em: <strong />,
          }}
        />
        <br />
        {can.update && <Trans>Get started by creating a new one!</Trans>}
      </Text>
      {can.update && (
        <Empty>
          <Link to={newDocumentPath(blog.id)}>
            <Button icon={<NewDocumentIcon color="currentColor" />}>
              {t("Create a document")}
            </Button>
          </Link>
          &nbsp;&nbsp;
          <Button onClick={handlePermissionsModalOpen} neutral>
            {t("Manage permissions")}…
          </Button>
        </Empty>
      )}
      <Modal
        title={t("Blog permissions")}
        onRequestClose={handlePermissionsModalClose}
        isOpen={permissionsModalOpen}
      >
        <BlogPermissions blog={blog} />
      </Modal>
    </Centered>
  );
}

const Centered = styled(Flex)`
  text-align: center;
  margin: 40vh auto 0;
  max-width: 380px;
  transform: translateY(-50%);
`;

const Empty = styled(Flex)`
  justify-content: center;
  margin: 10px 0;
`;

export default observer(EmptyBlog);
