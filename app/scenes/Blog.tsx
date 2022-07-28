import { observer } from "mobx-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  useParams,
  Redirect,
  Switch,
  Route,
  useHistory,
  useRouteMatch,
} from "react-router-dom";
import styled from "styled-components";
import breakpoint from "styled-components-breakpoint";
import Blog from "~/models/Blog";
import Search from "~/scenes/Search";
import Badge from "~/components/Badge";
import BlogDescription from "~/components/BlogDescription";
import BlogIcon from "~/components/BlogIcon";
import CenteredContent from "~/components/CenteredContent";
import Heading from "~/components/Heading";
import PlaceholderList from "~/components/List/Placeholder";
import PaginatedDocumentList from "~/components/PaginatedDocumentList";
import PinnedDocuments from "~/components/PinnedDocuments";
import PlaceholderText from "~/components/PlaceholderText";
import Scene from "~/components/Scene";
import Star, { AnimatedStar } from "~/components/Star";
import Tab from "~/components/Tab";
import Tabs from "~/components/Tabs";
import Tooltip from "~/components/Tooltip";
import { editBlog } from "~/actions/definitions/blogs";
import useCommandBarActions from "~/hooks/useCommandBarActions";
import usePolicy from "~/hooks/usePolicy";
import useStores from "~/hooks/useStores";
import { blogUrl, updateBlogUrl } from "~/utils/routeHelpers";
import Actions from "./Blog/Actions";
import DropToImport from "./Blog/DropToImport";
import Empty from "./Blog/Empty";

function BlogScene() {
  const params = useParams<{ id?: string }>();
  const history = useHistory();
  const match = useRouteMatch();
  const { t } = useTranslation();
  const { documents, pins, blogs, ui } = useStores();
  const [isFetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();

  const id = params.id || "";
  const blog: Blog | null | undefined = blogs.getByUrl(id) || blogs.get(id);
  const can = usePolicy(blog?.id || "");

  React.useEffect(() => {
    if (blog?.name) {
      const canonicalUrl = updateBlogUrl(match.url, blog);

      if (match.url !== canonicalUrl) {
        history.replace(canonicalUrl, history.location.state);
      }
    }
  }, [blog, blog?.name, history, id, match.url]);

  React.useEffect(() => {
    if (blog) {
      ui.setActiveBlog(blog.id);
    }

    return () => ui.setActiveBlog(undefined);
  }, [ui, blog]);

  React.useEffect(() => {
    setError(undefined);

    if (blog) {
      pins.fetchPage({
        blogId: blog.id,
      });
    }
  }, [pins, blog]);

  React.useEffect(() => {
    async function load() {
      if ((!can || !blog) && !error && !isFetching) {
        try {
          setError(undefined);
          setFetching(true);
          await blogs.fetch(id);
        } catch (err) {
          setError(err);
        } finally {
          setFetching(false);
        }
      }
    }

    load();
  }, [blogs, isFetching, blog, error, id, can]);

  useCommandBarActions(
    [editBlog],
    ui.activeBlogId ? [ui.activeBlogId] : undefined
  );

  if (!blog && error) {
    return <Search notFound />;
  }

  return blog ? (
    <Scene
      // Forced mount prevents animation of pinned documents when navigating
      // _between_ blogs, speeds up perceived performance.
      key={blog.id}
      centered={false}
      textTitle={blog.name}
      title={
        <>
          <BlogIcon blog={blog} expanded />
          &nbsp;{blog.name}
        </>
      }
      actions={<Actions blog={blog} />}
    >
      <DropToImport
        accept={documents.importFileTypes.join(", ")}
        disabled={!can.update}
        blogId={blog.id}
      >
        <CenteredContent withStickyHeader>
          {blog.isEmpty ? (
            <Empty blog={blog} />
          ) : (
            <>
              <HeadingWithIcon $isStarred={blog.isStarred}>
                <HeadingIcon blog={blog} size={40} expanded />
                {blog.name}
                {!blog.permission && (
                  <Tooltip
                    tooltip={t(
                      "This blog is only visible to those given access"
                    )}
                    placement="bottom"
                  >
                    <Badge>{t("Private")}</Badge>
                  </Tooltip>
                )}
                <StarButton blog={blog} size={32} />
              </HeadingWithIcon>
              <BlogDescription blog={blog} />

              <PinnedDocuments
                pins={pins.inBlog(blog.id)}
                canUpdate={can.update}
              />

              <Tabs>
                <Tab to={blogUrl(blog.url)} exact>
                  {t("Documents")}
                </Tab>
                <Tab to={blogUrl(blog.url, "updated")} exact>
                  {t("Recently updated")}
                </Tab>
                <Tab to={blogUrl(blog.url, "published")} exact>
                  {t("Recently published")}
                </Tab>
                <Tab to={blogUrl(blog.url, "old")} exact>
                  {t("Least recently updated")}
                </Tab>
                <Tab to={blogUrl(blog.url, "alphabetical")} exact>
                  {t("A–Z")}
                </Tab>
              </Tabs>
              <Switch>
                <Route path={blogUrl(blog.url, "alphabetical")}>
                  <PaginatedDocumentList
                    key="alphabetical"
                    documents={documents.alphabeticalInBlog(blog.id)}
                    fetch={documents.fetchAlphabetical}
                    options={{
                      blogId: blog.id,
                    }}
                  />
                </Route>
                <Route path={blogUrl(blog.url, "old")}>
                  <PaginatedDocumentList
                    key="old"
                    documents={documents.leastRecentlyUpdatedInBlog(blog.id)}
                    fetch={documents.fetchLeastRecentlyUpdated}
                    options={{
                      blogId: blog.id,
                    }}
                  />
                </Route>
                <Route path={blogUrl(blog.url, "recent")}>
                  <Redirect to={blogUrl(blog.url, "published")} />
                </Route>
                <Route path={blogUrl(blog.url, "published")}>
                  <PaginatedDocumentList
                    key="published"
                    documents={documents.recentlyPublishedInBlog(blog.id)}
                    fetch={documents.fetchRecentlyPublished}
                    options={{
                      blogId: blog.id,
                    }}
                    showPublished
                  />
                </Route>
                <Route path={blogUrl(blog.url, "updated")}>
                  <PaginatedDocumentList
                    key="updated"
                    documents={documents.recentlyUpdatedInBlog(blog.id)}
                    fetch={documents.fetchRecentlyUpdated}
                    options={{
                      blogId: blog.id,
                    }}
                  />
                </Route>
                <Route path={blogUrl(blog.url)} exact>
                  <PaginatedDocumentList
                    documents={documents.rootInBlog(blog.id)}
                    fetch={documents.fetchPage}
                    options={{
                      blogId: blog.id,
                      parentDocumentId: null,
                      sort: blog.sort.field,
                      direction: blog.sort.direction,
                    }}
                    showParentDocuments
                  />
                </Route>
              </Switch>
            </>
          )}
        </CenteredContent>
      </DropToImport>
    </Scene>
  ) : (
    <CenteredContent>
      <Heading>
        <PlaceholderText height={35} />
      </Heading>
      <PlaceholderList count={5} />
    </CenteredContent>
  );
}

const StarButton = styled(Star)`
  position: relative;
  top: 0;
  left: 10px;
  overflow: hidden;
  width: 24px;

  svg {
    position: relative;
    left: -4px;
  }
`;

const HeadingWithIcon = styled(Heading)<{ $isStarred: boolean }>`
  display: flex;
  align-items: center;

  ${AnimatedStar} {
    opacity: ${(props) => (props.$isStarred ? "1 !important" : 0)};
  }

  &:hover {
    ${AnimatedStar} {
      opacity: 0.5;

      &:hover {
        opacity: 1;
      }
    }
  }

  ${breakpoint("tablet")`
    margin-left: -40px;
  `};
`;

const HeadingIcon = styled(BlogIcon)`
  align-self: flex-start;
  flex-shrink: 0;
`;

export default observer(BlogScene);
