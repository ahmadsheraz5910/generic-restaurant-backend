import { Container, Heading, StatusBadge, usePrompt } from "@medusajs/ui";
import { PencilSquare, Trash } from "@medusajs/icons";
import { HttpTypes } from "../../../../../types/addons";
import { ActionMenu } from "../../../../components/ActionMenu";
import { useNavigate } from "react-router-dom";
import { useDeleteAddon } from "../../../../hooks/api/addons";
import { useTranslation } from "react-i18next";
import { SectionRow } from "../../../../components/section-row";

type Props = {
  addon: HttpTypes.AdminAddon;
};

const productStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "grey";
    case "proposed":
      return "orange";
    case "published":
      return "green";
    case "rejected":
      return "red";
    default:
      return "grey";
  }
};
const AddonGeneralSection = ({ addon }: Props) => {
  const prompt = usePrompt();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { mutateAsync } = useDeleteAddon(addon.id);

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.deleteWarning", {
        title: addon.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        navigate("..");
      },
    });
  };
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex gap-4 items-center">
          {addon.thumbnail ? (
            <img
              src={addon.thumbnail}
              alt={"thumbnail"}
              className="h-8 w-8 rounded-md object-cover object-center"
            />
          ) : null}
          <Heading>{addon.title}</Heading>
        </div>

        <div className="flex items-center gap-x-4">
          <StatusBadge color={productStatusColor(addon.status)}>
            {t(`products.productStatus.${addon.status}`)}
          </StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: "Edit",
                    to: "edit",
                    icon: <PencilSquare />,
                  },
                ],
              },
              {
                actions: [
                  {
                    label: "Delete",
                    onClick: handleDelete,
                    icon: <Trash />,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      <SectionRow title="Handle" value={`/${addon.handle}`} />
    </Container>
  );
};

export default AddonGeneralSection;
