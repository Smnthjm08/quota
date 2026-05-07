"use client";

import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@workspace/ui/components/pagination";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

type PaginatedTableProps<T> = {
  data: T[];
  initialPageSize?: number;
  pageSizeOptions?: number[];
  emptyState?: React.ReactNode;
  children: (args: {
    pageItems: T[];
    pageIndex: number;
    pageSize: number;
    pageCount: number;
    startIndex: number;
  }) => React.ReactNode;
};

function getVisiblePages(pageIndex: number, pageCount: number) {
  const currentPage = pageIndex + 1;

  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, pageCount, currentPage]);

  if (currentPage > 1) {
    pages.add(currentPage - 1);
  }

  if (currentPage < pageCount) {
    pages.add(currentPage + 1);
  }

  if (currentPage > 3) {
    pages.add(currentPage - 2);
  }

  if (currentPage < pageCount - 2) {
    pages.add(currentPage + 2);
  }

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((left, right) => left - right);
}

export function PaginatedTable<T>({
  data,
  initialPageSize = 10,
  pageSizeOptions = [10, 20, 30, 40, 50],
  emptyState = null,
  children,
}: PaginatedTableProps<T>) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const pageCount = Math.max(1, Math.ceil(data.length / pageSize));
  const safePageIndex = Math.min(pageIndex, pageCount - 1);

  const pageItems = React.useMemo(() => {
    const startIndex = safePageIndex * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
  }, [data, pageSize, safePageIndex]);

  const startIndex = safePageIndex * pageSize;

  const visiblePages = React.useMemo(
    () => getVisiblePages(safePageIndex, pageCount),
    [pageCount, safePageIndex]
  );

  const gotoPage = (nextPageIndex: number) => {
    const boundedPageIndex = Math.max(0, Math.min(nextPageIndex, pageCount - 1));
    setPageIndex(boundedPageIndex);
  };

  const isEmpty = data.length === 0;

  return (
    <div className="space-y-4">
      {children({
        pageItems,
        pageIndex: safePageIndex,
        pageSize,
        pageCount,
        startIndex,
      })}

      {isEmpty ? null : (
        <div className="flex flex-col gap-4  bg-background px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPageIndex(0);
              }}
            >
              <SelectTrigger id="rows-per-page" className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={`${option}`}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Pagination className="mx-0 w-auto justify-start md:justify-center">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (safePageIndex > 0) {
                      gotoPage(safePageIndex - 1);
                    }
                  }}
                  className={safePageIndex <= 0 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>

              {visiblePages.map((page) => {
                const isActive = page === safePageIndex + 1;
                const previousVisiblePage = visiblePages[visiblePages.indexOf(page) - 1];
                const shouldShowEllipsisBefore =
                  previousVisiblePage !== undefined && page - previousVisiblePage > 1;

                return (
                  <React.Fragment key={page}>
                    {shouldShowEllipsisBefore ? (
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : null}
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={isActive}
                        onClick={(event) => {
                          event.preventDefault();
                          gotoPage(page - 1);
                        }}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  </React.Fragment>
                );
              })}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(event) => {
                    event.preventDefault();
                    if (safePageIndex < pageCount - 1) {
                      gotoPage(safePageIndex + 1);
                    }
                  }}
                  className={
                    safePageIndex >= pageCount - 1
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="text-sm text-muted-foreground">
            Page {safePageIndex + 1} of {pageCount}
          </div>
        </div>
      )}

      {isEmpty ? <div className="px-4 pb-4">{emptyState}</div> : null}
    </div>
  );
}
