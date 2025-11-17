import { PropsWithChildren } from "react";
import { clx, Skeleton } from "@medusajs/ui";

export const SingleColumnPage = ({ children }: PropsWithChildren) => {
  return <div className="flex flex-col gap-y-3">{children}</div>;
};

interface SingleColumnPageSkeletonProps {
  sections?: number;
}
export const SingleColumnPageSkeleton = ({
  sections = 2,
}: SingleColumnPageSkeletonProps) => {
  return (
    <div className="flex flex-col gap-y-3">
      {Array.from({ length: sections }, (_, i) => i).map((section) => {
        return (
          <Skeleton
            key={section}
            className={clx("h-full max-h-[460px] w-full rounded-lg", {
              // First section is smaller on most pages, this gives us less
              // layout shifting in general,
              "max-h-[219px]": section === 0,
            })}
          />
        );
      })}
    </div>
  );
};
