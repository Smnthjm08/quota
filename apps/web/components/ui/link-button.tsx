"use client";

import Link, { LinkProps } from "next/link";
import * as React from "react";
import { Button } from "@workspace/ui/components/button";

type ButtonProps = React.ComponentProps<typeof Button>;

type LinkButtonProps = Omit<ButtonProps, "asChild"> & {
  href: LinkProps["href"];
  linkProps?: Omit<LinkProps, "href">;
};

const LinkButton = React.forwardRef<HTMLAnchorElement, LinkButtonProps>(
  function LinkButton({ href, linkProps, children, ...buttonProps }) {
    return (
      <Link href={href} {...linkProps}>
        <Button asChild {...(buttonProps as ButtonProps)}>
          {children}
        </Button>
      </Link>
    );
  }
);

export default LinkButton;
