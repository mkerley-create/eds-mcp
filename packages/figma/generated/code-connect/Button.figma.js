// This file is generated. Edit packages/core/src/Button/Button.tsx and its component doc instead.
import figma from 'figma';
import {EDSButton} from '@edmunds/eds-venom-adapter/EDSButton';

figma.connect(EDSButton, "https://www.figma.com/design/T8rUSiQrbvY1TbW2VSyCj6/Buttons?node-id=6001-19580", {
  props: {
  type: figma.enum("Type", {
    "Primary 1": "primary-1",
    "Primary 2": "primary-2",
    "Secondary 1": "secondary-1",
    "Secondary 2": "secondary-2"
  }),
  size: figma.enum("Size", {
    "Small": "small",
    "Medium": "medium",
    "Large": "large"
  }),
  style: figma.enum("Style", {
    "Squared": "squared",
    "Rounded": "rounded",
    "Circular": "circular"
  }),
  isFluid: figma.boolean("Fluid"),
  isDisabled: figma.enum("State", {
    "Default": false,
    "Disabled": true
  }),
  children: figma.string("Button Text"),
  },
  example: props => <EDSButton type={props.type} size={props.size} style={props.style} isFluid={props.isFluid} isDisabled={props.isDisabled} children={props.children} />,
});
