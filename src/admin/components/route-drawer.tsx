import { Drawer } from "@medusajs/ui";
import { PropsWithChildren, useEffect, useState } from "react";
import { Path, useNavigate } from "react-router-dom";
import { useStateAwareTo } from "../hooks/use-state-aware-to";
import { RouteModalProvider } from "../context/route-modal-context";
import { RouteModalForm } from "./route-modal-form";

type RouteDrawerProps = PropsWithChildren<{
  prev?: string | Partial<Path>;
}>;

const Root = ({ prev = "..", children }: RouteDrawerProps) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const to = useStateAwareTo(prev);

  /**
   * Open the modal when the component mounts. This
   * ensures that the entry animation is played.
   */
  useEffect(() => {
    setOpen(true);

    return () => {
      setOpen(false);
    };
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      document.body.style.pointerEvents = "auto";
      navigate(to, { replace: true });
      return;
    }

    setOpen(open);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <RouteModalProvider prev={to}>
        <Drawer.Content
          aria-describedby={undefined}
          className={"!bg-ui-bg-disabled !inset-y-5 !right-5"}
        >
          {children}
        </Drawer.Content>
      </RouteModalProvider>
    </Drawer>
  );
};

const Header = Drawer.Header;
const Title = Drawer.Title;
const Description = Drawer.Description;
const Body = Drawer.Body;
const Footer = Drawer.Footer;
const Close = Drawer.Close;
const Form = RouteModalForm;

/**
 * Drawer that is used to render a form on a separate route.
 *
 * Typically used for forms editing a resource.
 */
export const RouteDrawer = Object.assign(Root, {
  Header,
  Title,
  Body,
  Description,
  Footer,
  Close,
  Form,
});
