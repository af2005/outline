import { observer } from "mobx-react";
import { PlusIcon } from "outline-icons";
import * as React from "react";
import { useTranslation, Trans } from "react-i18next";
import styled from "styled-components";
import Blog from "~/models/Blog";
import Group from "~/models/Group";
import User from "~/models/User";
import Button from "~/components/Button";
import Divider from "~/components/Divider";
import Flex from "~/components/Flex";
import InputSelectPermission from "~/components/InputSelectPermission";
import Labeled from "~/components/Labeled";
import Modal from "~/components/Modal";
import PaginatedList from "~/components/PaginatedList";
import Switch from "~/components/Switch";
import Text from "~/components/Text";
import useBoolean from "~/hooks/useBoolean";
import useCurrentUser from "~/hooks/useCurrentUser";
import useStores from "~/hooks/useStores";
import useToasts from "~/hooks/useToasts";
import AddGroupsToBlog from "./AddGroupsToBlog";
import AddPeopleToBlog from "./AddPeopleToBlog";
import BlogGroupMemberListItem from "./components/BlogGroupMemberListItem";
import MemberListItem from "./components/MemberListItem";

type Props = {
  blog: Blog;
};

function BlogPermissions({ blog }: Props) {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const {
    memberships,
    blogGroupMemberships,
    users,
    groups,
    auth,
  } = useStores();
  const { showToast } = useToasts();

  const [
    addGroupModalOpen,
    handleAddGroupModalOpen,
    handleAddGroupModalClose,
  ] = useBoolean();

  const [
    addMemberModalOpen,
    handleAddMemberModalOpen,
    handleAddMemberModalClose,
  ] = useBoolean();

  const handleRemoveUser = React.useCallback(
    async (user) => {
      try {
        await memberships.delete({
          blogId: blog.id,
          userId: user.id,
        });
        showToast(
          t(`{{ userName }} was removed from the blog`, {
            userName: user.name,
          }),
          {
            type: "success",
          }
        );
      } catch (err) {
        showToast(t("Could not remove user"), {
          type: "error",
        });
      }
    },
    [memberships, showToast, blog, t]
  );

  const handleUpdateUser = React.useCallback(
    async (user, permission) => {
      try {
        await memberships.create({
          blogId: blog.id,
          userId: user.id,
          permission,
        });
        showToast(
          t(`{{ userName }} permissions were updated`, {
            userName: user.name,
          }),
          {
            type: "success",
          }
        );
      } catch (err) {
        showToast(t("Could not update user"), {
          type: "error",
        });
      }
    },
    [memberships, showToast, blog, t]
  );

  const handleRemoveGroup = React.useCallback(
    async (group) => {
      try {
        await blogGroupMemberships.delete({
          blogId: blog.id,
          groupId: group.id,
        });
        showToast(
          t(`The {{ groupName }} group was removed from the blog`, {
            groupName: group.name,
          }),
          {
            type: "success",
          }
        );
      } catch (err) {
        showToast(t("Could not remove group"), {
          type: "error",
        });
      }
    },
    [blogGroupMemberships, showToast, blog, t]
  );

  const handleUpdateGroup = React.useCallback(
    async (group, permission) => {
      try {
        await blogGroupMemberships.create({
          blogId: blog.id,
          groupId: group.id,
          permission,
        });
        showToast(
          t(`{{ groupName }} permissions were updated`, {
            groupName: group.name,
          }),
          {
            type: "success",
          }
        );
      } catch (err) {
        showToast(t("Could not update user"), {
          type: "error",
        });
      }
    },
    [blogGroupMemberships, showToast, blog, t]
  );

  const handleChangePermission = React.useCallback(
    async (permission: string) => {
      try {
        await blog.save({
          permission,
        });
        showToast(t("Default access permissions were updated"), {
          type: "success",
        });
      } catch (err) {
        showToast(t("Could not update permissions"), {
          type: "error",
        });
      }
    },
    [blog, showToast, t]
  );

  const fetchOptions = React.useMemo(
    () => ({
      id: blog.id,
    }),
    [blog.id]
  );

  const handleSharingChange = React.useCallback(
    async (ev: React.ChangeEvent<HTMLInputElement>) => {
      try {
        await blog.save({
          sharing: ev.target.checked,
        });
        showToast(t("Public document sharing permissions were updated"), {
          type: "success",
        });
      } catch (err) {
        showToast(t("Could not update public document sharing"), {
          type: "error",
        });
      }
    },
    [blog, showToast, t]
  );

  const blogName = blog.name;
  const blogGroups = groups.inBlog(blog.id);
  const blogUsers = users.inBlog(blog.id);
  const isEmpty = !blogGroups.length && !blogUsers.length;
  const sharing = blog.sharing;
  const teamSharingEnabled = !!auth.team && auth.team.sharing;

  return (
    <Flex column>
      <InputSelectPermission
        onChange={handleChangePermission}
        value={blog.permission || ""}
      />
      <PermissionExplainer size="small">
        {!blog.permission && (
          <Trans
            defaults="The <em>{{ blogName }}</em> blog is private. Team members have no access to it by default."
            values={{
              blogName,
            }}
            components={{
              em: <strong />,
            }}
          />
        )}
        {blog.permission === "read" && (
          <Trans
            defaults="Team members can view documents in the <em>{{ blogName }}</em> blog by default."
            values={{
              blogName,
            }}
            components={{
              em: <strong />,
            }}
          />
        )}
        {blog.permission === "read_write" && (
          <Trans
            defaults="Team members can view and edit documents in the <em>{{ blogName }}</em> blog by
          default."
            values={{
              blogName,
            }}
            components={{
              em: <strong />,
            }}
          />
        )}
      </PermissionExplainer>
      <Switch
        id="sharing"
        label={t("Public document sharing")}
        onChange={handleSharingChange}
        checked={sharing && teamSharingEnabled}
        disabled={!teamSharingEnabled}
        note={
          teamSharingEnabled ? (
            <Trans>
              When enabled, documents can be shared publicly on the internet.
            </Trans>
          ) : (
            <Trans>
              Public sharing is currently disabled in the team security
              settings.
            </Trans>
          )
        }
      />
      <Labeled label={t("Additional access")}>
        <Actions gap={8}>
          <Button
            type="button"
            onClick={handleAddGroupModalOpen}
            icon={<PlusIcon />}
            neutral
          >
            {t("Add groups")}
          </Button>
          <Button
            type="button"
            onClick={handleAddMemberModalOpen}
            icon={<PlusIcon />}
            neutral
          >
            {t("Add people")}
          </Button>
        </Actions>
      </Labeled>
      <Divider />
      {isEmpty && (
        <Empty>
          <Trans>
            Add specific access for individual groups and team members
          </Trans>
        </Empty>
      )}
      <PaginatedList
        items={blogGroups}
        fetch={blogGroupMemberships.fetchPage}
        options={fetchOptions}
        renderItem={(group: Group) => (
          <BlogGroupMemberListItem
            key={group.id}
            group={group}
            blogGroupMembership={blogGroupMemberships.get(
              `${group.id}-${blog.id}`
            )}
            onRemove={() => handleRemoveGroup(group)}
            onUpdate={(permission) => handleUpdateGroup(group, permission)}
          />
        )}
      />
      {blogGroups.length ? <Divider /> : null}
      <PaginatedList
        key={`blog-users-${blog.permission || "none"}`}
        items={blogUsers}
        fetch={memberships.fetchPage}
        options={fetchOptions}
        renderItem={(item: User) => (
          <MemberListItem
            key={item.id}
            user={item}
            membership={memberships.get(`${item.id}-${blog.id}`)}
            canEdit={item.id !== user.id}
            onRemove={() => handleRemoveUser(item)}
            onUpdate={(permission) => handleUpdateUser(item, permission)}
          />
        )}
      />
      <Modal
        title={t(`Add groups to {{ blogName }}`, {
          blogName: blog.name,
        })}
        onRequestClose={handleAddGroupModalClose}
        isOpen={addGroupModalOpen}
      >
        <AddGroupsToBlog
          blog={blog}
          onSubmit={handleAddGroupModalClose}
        />
      </Modal>
      <Modal
        title={t(`Add people to {{ blogName }}`, {
          blogName: blog.name,
        })}
        onRequestClose={handleAddMemberModalClose}
        isOpen={addMemberModalOpen}
      >
        <AddPeopleToBlog
          blog={blog}
          onSubmit={handleAddMemberModalClose}
        />
      </Modal>
    </Flex>
  );
}

const Empty = styled(Text)`
  margin-top: 8px;
`;

const PermissionExplainer = styled(Text)`
  margin-top: -8px;
  margin-bottom: 24px;
`;

const Actions = styled(Flex)`
  margin-bottom: 12px;
`;

export default observer(BlogPermissions);
