import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation, Trans } from "react-i18next";
import { useHistory } from "react-router-dom";
import Blog from "~/models/Blog";
import ConfirmationDialog from "~/components/ConfirmationDialog";
import Text from "~/components/Text";
import useCurrentTeam from "~/hooks/useCurrentTeam";
import useStores from "~/hooks/useStores";
import { homePath } from "~/utils/routeHelpers";

type Props = {
  blog: Blog;
  onSubmit: () => void;
};

function BlogDeleteDialog({ blog, onSubmit }: Props) {
  const team = useCurrentTeam();
  const { ui } = useStores();
  const history = useHistory();
  const { t } = useTranslation();

  const handleSubmit = async () => {
    const redirect = blog.id === ui.activeBlogId;
    await blog.delete();
    onSubmit();
    if (redirect) {
      history.push(homePath());
    }
  };

  return (
    <ConfirmationDialog
      onSubmit={handleSubmit}
      submitText={t("I’m sure – Delete")}
      savingText={`${t("Deleting")}…`}
      danger
    >
      <>
        <Text type="secondary">
          <Trans
            defaults="Are you sure about that? Deleting the <em>{{blogName}}</em> blog is permanent and cannot be restored, however documents within will be moved to the trash."
            values={{
              blogName: blog.name,
            }}
            components={{
              em: <strong />,
            }}
          />
        </Text>
      </>
    </ConfirmationDialog>
  );
}

export default observer(BlogDeleteDialog);
