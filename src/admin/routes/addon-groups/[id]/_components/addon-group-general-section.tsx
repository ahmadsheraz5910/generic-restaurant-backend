import { PencilSquare, Trash } from "@medusajs/icons";
import { Container, Heading, Text, usePrompt } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { HttpTypes } from "../../../../../types/addons";
import { useDeleteAddonGroup } from "../../../../hooks/api/addon-groups";
import { ActionMenu } from "../../../../components/ActionMenu";

type AddonGroupGeneralSectionProps = {
  addonGroup: HttpTypes.AdminAddonGroup;
};

export const AddonGroupGeneralSection = ({
  addonGroup,
}: AddonGroupGeneralSectionProps) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const navigate = useNavigate();

  const { mutateAsync } = useDeleteAddonGroup(addonGroup.id!);

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("addonGroups.deleteWarning", {
        count: 1,
        title: addonGroup.title,
      }),
    });

    if (!res) {
      return;
    }

    await mutateAsync();
    navigate("../", { replace: true });
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{addonGroup.title}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: `/addon-groups/${addonGroup.id}/edit`,
                  disabled: !addonGroup.id,
                },
              ],
            },
            {
              actions: [
                {
                  icon: <Trash />,
                  label: t("actions.delete"),
                  onClick: handleDelete,
                  disabled: !addonGroup.id,
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("fields.handle")}
        </Text>
        <Text size="small">/{addonGroup.handle}</Text>
      </div>
    </Container>
  );
};
