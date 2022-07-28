import * as React from "react";
import { sortNavigationNodes } from "@shared/utils/collections";
import Blog from "~/models/Blog";
import Document from "~/models/Document";

export default function useBlogDocuments(
  blog: Blog | undefined,
  activeDocument: Document | undefined
) {
  return React.useMemo(() => {
    if (!blog) {
      return [];
    }

    const insertDraftDocument =
      activeDocument?.isActive &&
      activeDocument?.isDraft &&
      activeDocument?.parentId === blog.id &&
      !activeDocument?.parentDocumentId;

    return insertDraftDocument
      ? sortNavigationNodes(
          [activeDocument.asNavigationNode, ...blog.sortedDocuments],
          blog.sort,
          false
        )
      : blog.sortedDocuments;
  }, [
    activeDocument?.isActive,
    activeDocument?.isDraft,
    activeDocument?.parentId,
    activeDocument?.parentDocumentId,
    activeDocument?.asNavigationNode,
    blog,
    blog?.sortedDocuments,
    blog?.id,
    blog?.sort,
  ]);
}
