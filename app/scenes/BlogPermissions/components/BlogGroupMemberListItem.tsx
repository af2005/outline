import * as React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import BlogGroupMembership from "~/models/BlogGroupMembership";
import Group from "~/models/Group";
import GroupListItem from "~/components/GroupListItem";
import InputSelect, { Props as SelectProps } from "~/components/InputSelect";
import BlogGroupMemberMenu from "~/menus/BlogGroupMemberMenu";

type Props = {
  group: Group;
  blogGroupMembership: BlogGroupMembership | null | undefined;
  onUpdate: (permission: string) => void;
  onRemove: () => void;
};

const BlogGroupMemberListItem = ({
  group,
  blogGroupMembership,
  onUpdate,
  onRemove,
}: Props) => {
  const { t } = useTranslation();
  const PERMISSIONS = React.useMemo(
    () => [
      {
        label: t("View only"),
        value: "read",
      },
      {
        label: t("View and edit"),
        value: "read_write",
      },
    ],
    [t]
  );

  return (
    <GroupListItem
      group={group}
      showAvatar
      renderActions={({ openMembersModal }) => (
        <>
          <Select
            label={t("Permissions")}
            options={PERMISSIONS}
            value={
              blogGroupMembership ? blogGroupMembership.permission : undefined
            }
            onChange={onUpdate}
            ariaLabel={t("Permissions")}
            labelHidden
            nude
          />
          <BlogGroupMemberMenu
            onMembers={openMembersModal}
            onRemove={onRemove}
          />
        </>
      )}
    />
  );
};

const Select = styled(InputSelect)`
  margin: 0;
  font-size: 14px;
  border-color: transparent;
  box-shadow: none;
  color: ${(props) => props.theme.textSecondary};

  select {
    margin: 0;
  }
` as React.ComponentType<SelectProps>;

export default BlogGroupMemberListItem;
