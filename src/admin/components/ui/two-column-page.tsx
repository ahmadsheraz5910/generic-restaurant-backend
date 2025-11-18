import { clx, Skeleton } from "@medusajs/ui";
import { Children, ComponentPropsWithoutRef, PropsWithChildren } from "react";

const Root = ({ children }: PropsWithChildren) => {
  const childrenArray = Children.toArray(children);

  if (childrenArray.length !== 2) {
    throw new Error("TwoColumnPage expects exactly two children");
  }

  const [main, sidebar] = childrenArray;

  return (
    <div className="flex w-full flex-col gap-y-3">
      <div className="flex w-full flex-col items-start gap-x-4 gap-y-3 xl:grid xl:grid-cols-[minmax(0,_1fr)_440px]">
        <div className="flex w-full min-w-0 flex-col gap-y-3">{main}</div>
        <div className="flex w-full flex-col gap-y-3 xl:mt-0">{sidebar}</div>
      </div>
    </div>
  );
};

const Main = ({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) => {
  return (
    <div className={clx("flex w-full flex-col gap-y-3", className)} {...props}>
      {children}
    </div>
  );
};

const Sidebar = ({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      className={clx(
        "flex w-full max-w-[100%] flex-col gap-y-3 xl:mt-0 xl:max-w-[440px]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const TwoColumnPage = Object.assign(Root, { Main, Sidebar });

export const TwoColumnPageSkeleton = ({
  mainSections = 2,
  sidebarSections = 1,
}) => {
  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex flex-col gap-x-4 gap-y-3 xl:flex-row xl:items-start">
        <div className="flex w-full flex-col gap-y-3">
          {Array.from({ length: mainSections }, (_, i) => i).map((section) => {
            return (
              <Skeleton
                key={section}
                className={clx("h-full max-h-[460px] w-full rounded-lg", {
                  "max-h-[219px]": section === 0,
                })}
              />
            );
          })}
        </div>
        <div className="flex w-full max-w-[100%] flex-col gap-y-3 xl:mt-0 xl:max-w-[440px]">
          {Array.from({ length: sidebarSections }, (_, i) => i).map(
            (section) => {
              return (
                <Skeleton
                  key={section}
                  className={clx("h-full max-h-[320px] w-full rounded-lg", {
                    "max-h-[140px]": section === 0,
                  })}
                />
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};
