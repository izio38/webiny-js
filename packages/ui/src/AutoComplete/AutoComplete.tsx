import * as React from "react";
import Downshift from "downshift";
import { Input } from "../Input";
import classNames from "classnames";
import { Elevation } from "../Elevation";
import { Typography } from "../Typography";
import keycode from "keycode";
import { autoCompleteStyle, suggestionList } from "./styles";
import { AutoCompleteBaseProps } from "./types";
import { getOptionValue, getOptionText, findInAliases } from "./utils";
import { isEqual } from "lodash";
import MaterialSpinner from "react-spinner-material";
import { css } from "emotion";

const menuStyles = css({
    top: "unset !important",
    bottom: 75
});

const listStyles = css({
    "&.autocomplete__options-list": {
        listStyle: "none",
        paddingLeft: 0,
        "& li": {
            margin: 0
        }
    }
});

export enum Placement {
    top = "top",
    bottom = "bottom"
}

export type Props = AutoCompleteBaseProps & {
    /* Placement position of dropdown menu, can be either `top` or `bottom`. */
    placement?: Placement;

    /* A callback that is executed each time a value is changed. */
    onChange?: (value: any, selection: any) => void;

    /* If true, will show a loading spinner on the right side of the input. */
    loading?: boolean;
};

type State = {
    inputValue: string;
};

function Spinner() {
    return <MaterialSpinner size={24} spinnerColor={"#fa5723"} spinnerWidth={2} visible />;
}

class AutoComplete extends React.Component<Props, State> {
    static defaultProps = {
        valueProp: "id",
        textProp: "name",
        options: [],
        placement: Placement.bottom,
        renderItem(item: any) {
            return <Typography use={"body2"}>{getOptionText(item, this.props)}</Typography>;
        }
    };

    state = {
        inputValue: ""
    };

    /**
     * Helps us trigger some of the downshift's methods (eg. clearSelection) and helps us to avoid adding state.
     */
    downshift: any = React.createRef();

    componentDidUpdate(previousProps: any) {
        const { value, options } = this.props;
        const { value: previousValue } = previousProps;

        if (!isEqual(value, previousValue)) {
            let item = null;

            if (value) {
                if (typeof value === "object") {
                    item = value;
                } else {
                    item =
                        options.find(option => {
                            return value === getOptionValue(option, this.props);
                        }) || null;
                }
            }

            const { current: downshift } = this.downshift;
            downshift && downshift.selectItem(item);
        }
    }

    /**
     * Renders options - based on user's input. It will try to match input text with available options.
     */
    renderOptions({
        options,
        isOpen,
        highlightedIndex,
        selectedItem,
        getMenuProps,
        getItemProps,
        placement
    }: any) {
        if (!isOpen) {
            return null;
        }

        const { renderItem } = this.props;

        const filtered = options.filter(item => {
            // 2) At the end, we want to show only options that are matched by typed text.
            if (!this.state.inputValue) {
                return true;
            }

            if (item.aliases) {
                return findInAliases(item, this.state.inputValue);
            }

            return getOptionText(item, this.props)
                .toLowerCase()
                .includes(this.state.inputValue.toLowerCase());
        });

        if (!filtered.length) {
            return (
                <Elevation
                    z={1}
                    className={classNames({
                        [menuStyles]: placement === Placement.top
                    })}
                >
                    <ul
                        className={classNames("autocomplete__options-list", listStyles)}
                        {...getMenuProps()}
                    >
                        <li>
                            <Typography use={"body2"}>No results.</Typography>
                        </li>
                    </ul>
                </Elevation>
            );
        }

        return (
            <Elevation z={1} className={classNames({ [menuStyles]: placement === Placement.top })}>
                <ul
                    className={classNames("autocomplete__options-list", listStyles)}
                    {...getMenuProps()}
                >
                    {filtered.map((item, index) => {
                        const itemValue = getOptionValue(item, this.props);

                        // Base classes.
                        const itemClassNames = {
                            [suggestionList]: true,
                            highlighted: highlightedIndex === index,
                            selected: false
                        };

                        // Add "selected" class if the item is selected.
                        if (
                            selectedItem &&
                            getOptionValue(selectedItem, this.props) === itemValue
                        ) {
                            itemClassNames.selected = true;
                        }

                        // Render the item.
                        return (
                            <li
                                key={itemValue}
                                {...getItemProps({
                                    index,
                                    item,
                                    className: classNames(itemClassNames)
                                })}
                            >
                                {renderItem.call(this, item, index)}
                            </li>
                        );
                    })}
                </ul>
            </Elevation>
        );
    }

    render() {
        const {
            className,
            options,
            onChange,
            value, // eslint-disable-line
            valueProp, // eslint-disable-line
            textProp, // eslint-disable-line
            onInput,
            validation = { isValid: null },
            placement,
            ...otherInputProps
        } = this.props;

        // Downshift related props.
        const downshiftProps = {
            className: autoCompleteStyle,
            itemToString: item => getOptionText(item, this.props),
            defaultSelectedItem: value,
            onChange: selection => {
                if (!selection || !onChange) {
                    return;
                }
                onChange(getOptionValue(selection, this.props), selection);
                this.setState(state => ({
                    ...state,
                    inputValue: ""
                }));
            }
        };

        return (
            <div className={classNames(autoCompleteStyle, className)}>
                <Downshift {...downshiftProps} ref={this.downshift}>
                    {({ getInputProps, openMenu, ...rest }) => (
                        <div>
                            <Input
                                {...getInputProps({
                                    // This prop is above `otherInputProps` since it can be overridden by the user.
                                    trailingIcon: this.props.loading && <Spinner />,
                                    ...otherInputProps,
                                    // @ts-ignore
                                    validation,
                                    rawOnChange: true,
                                    onChange: ev => ev,
                                    onBlur: ev => ev,
                                    onFocus: ev => {
                                        openMenu();
                                        otherInputProps.onFocus && otherInputProps.onFocus(ev);
                                    },
                                    onKeyDown: (ev: React.KeyboardEvent<HTMLInputElement>) => {
                                        const keyCode: string = keycode(ev as unknown as Event);

                                        if (keyCode === "backspace") {
                                            onChange(null);
                                            setTimeout(() => openMenu(), 50);
                                        }
                                    },
                                    onKeyUp: (ev: React.KeyboardEvent<HTMLInputElement>) => {
                                        const keyCode: string = keycode(ev as unknown as Event);

                                        const target = ev.currentTarget;
                                        const inputValue = target.value || "";

                                        // If user pressed 'esc', 'enter' or similar...
                                        if (
                                            keyCode &&
                                            keyCode.length > 1 &&
                                            keyCode !== "backspace"
                                        ) {
                                            return;
                                        }

                                        // If values are the same, exit, do not update current search term.
                                        if (inputValue === this.state.inputValue) {
                                            return;
                                        }

                                        this.setState(
                                            state => ({
                                                ...state,
                                                inputValue
                                            }),
                                            () => {
                                                onInput && onInput(inputValue);
                                            }
                                        );
                                    }
                                })}
                            />
                            {!otherInputProps.disabled &&
                                !otherInputProps.readOnly &&
                                this.renderOptions({ ...rest, options, placement })}
                        </div>
                    )}
                </Downshift>
            </div>
        );
    }
}

export { AutoComplete };
