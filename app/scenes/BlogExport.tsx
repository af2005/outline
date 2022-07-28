import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation, Trans } from "react-i18next";
import Blog from "~/models/Blog";
import Button from "~/components/Button";
import Flex from "~/components/Flex";
import Text from "~/components/Text";
import useToasts from "~/hooks/useToasts";

type Props = {
  blog: Blog;
  onSubmit: () => void;
};

function BlogExport({ blog, onSubmit }: Props) {
  const [isLoading, setIsLoading] = React.useState(false);
  const { t } = useTranslation();
  const { showToast } = useToasts();

  const handleSubmit = React.useCallback(
    async (ev: React.SyntheticEvent) => {
      ev.preventDefault();
      setIsLoading(true);
      await blog.export();

      setIsLoading(false);
      showToast(
        t("Export started, you will receive an email when it’s complete.")
      );
      onSubmit();
    },
    [blog, onSubmit, showToast, t]
  );

  return (
    <Flex column>
      <form onSubmit={handleSubmit}>
        <Text type="secondary">
          <Trans
            defaults="Exporting the blog <em>{{blogName}}</em> may take a few seconds. Your documents will be a zip of folders with files in Markdown format. Please visit the Export section on settings to get the zip."
            values={{
              blogName: blog.name,
            }}
            components={{
              em: <strong />,
            }}
          />
        </Text>
        <Button type="submit" disabled={isLoading} primary>
          {isLoading ? `${t("Exporting")}…` : t("Export Blog")}
        </Button>
      </form>
    </Flex>
  );
}

export default observer(BlogExport);
