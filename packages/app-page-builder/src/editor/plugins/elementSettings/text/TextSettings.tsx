import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import get from "lodash/get";
import set from "lodash/set";
import merge from "lodash/merge";
import { plugins } from "@webiny/plugins";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { Link } from "@webiny/react-router";
import {
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorResponsiveModePlugin,
    PbThemePlugin
} from "../../../../types";
import {
    activeElementAtom,
    elementWithChildrenByIdSelector,
    uiAtom
} from "../../../recoil/modules";
// Components
import Accordion from "../../elementSettings/components/Accordion";
import Wrapper from "../../elementSettings/components/Wrapper";
import SelectField from "../../elementSettings/components/SelectField";
import { BaseColorPicker } from "../components/ColorPicker";
import useUpdateHandlers from "../../elementSettings/useUpdateHandlers";
import TextAlignment from "./TextAlignment";
import { applyFallbackDisplayMode } from "../elementSettingsUtils";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    widthInputStyle: css({
        maxWidth: 60
    }),
    rightCellStyle: css({
        justifySelf: "end"
    }),
    leftCellStyle: css({
        alignSelf: "center"
    }),
    warningMessageGrid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginTop: -16,
            marginBottom: 24,
            color: "var(--mdc-theme-text-secondary-on-background)"
        }
    })
};
const TEXT_SETTINGS_COUNT = 4;
const DATA_NAMESPACE = "data.text";

const TextSettings: React.FunctionComponent<
    PbEditorPageElementSettingsRenderComponentProps & {
        options: any;
    }
> = ({ defaultAccordionValue, options }) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementWithChildrenByIdSelector(activeElementId));
    const [{ theme }] = plugins.byType<PbThemePlugin>("pb-theme");

    const { config: activeDisplayModeConfig } = useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .find(pl => pl.config.displayMode === displayMode);
    }, [displayMode]);

    const themeTypographyOptions = useMemo(() => {
        const { types } = theme.elements[element.type] || { types: [] };
        return types.map(el => (
            <option value={el.className} key={el.label}>
                {el.label}
            </option>
        ));
    }, [theme]);

    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE,
        postModifyElement: ({ newElement }) => {
            const value = get(newElement, `${DATA_NAMESPACE}.${displayMode}`, {});
            // if only partial settings are there, merge it with fallback value
            if (Object.keys(value).length < TEXT_SETTINGS_COUNT) {
                set(newElement, `${DATA_NAMESPACE}.${displayMode}`, merge(fallbackValue, value));
            }
        }
    });

    const updateColor = useCallback(
        (value: string) => getUpdateValue(`${displayMode}.color`)(value),
        [getUpdateValue, displayMode]
    );
    const updateColorPreview = useCallback(
        (value: string) => getUpdatePreview(`${displayMode}.color`)(value),
        [getUpdatePreview]
    );

    const updateTypography = useCallback(
        (value: string) => getUpdateValue(`${displayMode}.typography`)(value),
        [getUpdateValue, displayMode]
    );

    const updateAlignment = useCallback(
        (value: string) => getUpdateValue(`${displayMode}.alignment`)(value),
        [getUpdateValue, displayMode]
    );

    const updateTag = useCallback(
        (value: string) => getUpdateValue(`${displayMode}.tag`)(value),
        [getUpdateValue, displayMode]
    );

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode]
    );

    const text = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue);

    if (!text) {
        return null;
    }

    return (
        <Accordion
            title={"Text"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${activeDisplayModeConfig.displayMode}`}>
                    {activeDisplayModeConfig.icon}
                </Tooltip>
            }
        >
            <>
                <Wrapper containerClassName={classes.grid} label={"Color"}>
                    <BaseColorPicker
                        value={text.color}
                        updateValue={updateColor}
                        updatePreview={updateColorPreview}
                    />
                </Wrapper>
                {options.useCustomTag && (
                    <Wrapper
                        containerClassName={classes.grid}
                        label={"Heading Type"}
                        leftCellSpan={5}
                        rightCellSpan={7}
                    >
                        <SelectField value={text.tag} onChange={updateTag}>
                            {options.tags.map(tag => (
                                <option value={tag} key={tag}>
                                    {tag.toUpperCase()}
                                </option>
                            ))}
                        </SelectField>
                    </Wrapper>
                )}
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Typography"}
                    leftCellSpan={5}
                    rightCellSpan={7}
                >
                    <SelectField
                        value={text.typography}
                        onChange={updateTypography}
                        disabled={themeTypographyOptions.length === 0}
                    >
                        {themeTypographyOptions}
                    </SelectField>
                </Wrapper>
                {themeTypographyOptions.length === 0 && (
                    <Grid className={classes.warningMessageGrid}>
                        <Cell span={12}>
                            <Typography use={"caption"}>
                                Please add typography options in{" "}
                                <Link
                                    to={
                                        "https://github.com/webiny/webiny-js/blob/next/apps/theme/pageBuilder/index.ts#L21"
                                    }
                                    target={"_blank"}
                                >
                                    theme
                                </Link>
                                .
                            </Typography>
                        </Cell>
                    </Grid>
                )}
                <Wrapper
                    containerClassName={classes.grid}
                    label={"Alignment"}
                    leftCellSpan={3}
                    rightCellSpan={9}
                    leftCellClassName={classes.leftCellStyle}
                    rightCellClassName={classes.rightCellStyle}
                >
                    <TextAlignment value={text.alignment} onChange={updateAlignment} />
                </Wrapper>
            </>
        </Accordion>
    );
};

export default React.memo(TextSettings);
