import { observer } from "mobx-react";
import { CalendarIcon } from "outline-icons";
import { getLuminance } from "polished";
import * as React from "react";
import Blog from "~/models/Blog";
import { icons } from "~/components/IconPicker";
import useStores from "~/hooks/useStores";
import Logger from "~/utils/Logger";

type Props = {
  blog: Blog;
  expanded?: boolean;
  size?: number;
  color?: string;
};

function ResolvedBlogIcon({ blog, color: inputColor, expanded, size }: Props) {
  const { ui } = useStores();

  // If the chosen icon color is very dark then we invert it in dark mode
  // otherwise it will be impossible to see against the dark background.
  const color =
    inputColor ||
    (ui.resolvedTheme === "dark" && blog.color !== "currentColor"
      ? getLuminance(blog.color) > 0.09
        ? blog.color
        : "currentColor"
      : blog.color);

  if (blog.icon && blog.icon !== "blog") {
    try {
      const Component = icons[blog.icon].component;
      return <Component color={color} size={size} />;
    } catch (error) {
      Logger.warn("Failed to render custom icon", {
        icon: blog.icon,
      });
    }
  }

  return <CalendarIcon color={color} size={size} />;
}

export default observer(ResolvedBlogIcon);
