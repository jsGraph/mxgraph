/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

/**
 * Variable: DEFAULT_HOTSPOT
 *
 * Defines the portion of the cell which is to be used as a connectable
 * region. Default is 0.3. Possible values are 0 < x <= 1.
 */
export const DEFAULT_HOTSPOT = 0.3;

/**
 * Variable: MIN_HOTSPOT_SIZE
 *
 * Defines the minimum size in pixels of the portion of the cell which is
 * to be used as a connectable region. Default is 8.
 */
export const MIN_HOTSPOT_SIZE = 8;

/**
 * Variable: MAX_HOTSPOT_SIZE
 *
 * Defines the maximum size in pixels of the portion of the cell which is
 * to be used as a connectable region. Use 0 for no maximum. Default is 0.
 */
export const MAX_HOTSPOT_SIZE = 0;

/**
 * Variable: RENDERING_HINT_EXACT
 *
 * Defines the exact rendering hint.
 */
export const RENDERING_HINT_EXACT = 'exact';

/**
 * Variable: RENDERING_HINT_FASTER
 *
 * Defines the faster rendering hint.
 */
export const RENDERING_HINT_FASTER = 'faster';

/**
 * Variable: RENDERING_HINT_FASTEST
 *
 * Defines the fastest rendering hint.
 */
export const RENDERING_HINT_FASTEST = 'fastest';

/**
 * Variable: DIALECT_SVG
 *
 * Defines the SVG display dialect name.
 */
export const DIALECT_SVG = 'svg';

/**
 * Variable: DIALECT_MIXEDHTML
 *
 * Defines the mixed HTML display dialect name.
 */
export const DIALECT_MIXEDHTML = 'mixedHtml';

/**
 * Variable: DIALECT_PREFERHTML
 *
 * Defines the preferred HTML display dialect name.
 */
export const DIALECT_PREFERHTML = 'preferHtml';

/**
 * Variable: DIALECT_STRICTHTML
 *
 * Defines the strict HTML display dialect.
 */
export const DIALECT_STRICTHTML = 'strictHtml';

/**
 * Variable: NS_SVG
 *
 * Defines the SVG namespace.
 */
export const NS_SVG = 'http://www.w3.org/2000/svg';

/**
 * Variable: NS_XLINK
 *
 * Defines the XLink namespace.
 */
export const NS_XLINK = 'http://www.w3.org/1999/xlink';

/**
 * Variable: SHADOWCOLOR
 *
 * Defines the color to be used to draw shadows in shapes and windows.
 * Default is gray.
 */
export const SHADOWCOLOR = 'gray';

/**
 * Variable: VML_SHADOWCOLOR
 *
 * Used for shadow color in filters where transparency is not supported
 * (Microsoft Internet Explorer). Default is gray.
 */
export const VML_SHADOWCOLOR = 'gray';

/**
 * Variable: SHADOW_OFFSET_X
 *
 * Specifies the x-offset of the shadow. Default is 2.
 */
export const SHADOW_OFFSET_X = 2;

/**
 * Variable: SHADOW_OFFSET_Y
 *
 * Specifies the y-offset of the shadow. Default is 3.
 */
export const SHADOW_OFFSET_Y = 3;

/**
 * Variable: SHADOW_OPACITY
 *
 * Defines the opacity for shadows. Default is 1.
 */
export const SHADOW_OPACITY = 1;

/**
 * Variable: NODETYPE_ELEMENT
 *
 * DOM node of type ELEMENT.
 */
export const NODETYPE_ELEMENT = 1;

/**
 * Variable: NODETYPE_ATTRIBUTE
 *
 * DOM node of type ATTRIBUTE.
 */
export const NODETYPE_ATTRIBUTE = 2;

/**
 * Variable: NODETYPE_TEXT
 *
 * DOM node of type TEXT.
 */
export const NODETYPE_TEXT = 3;

/**
 * Variable: NODETYPE_CDATA
 *
 * DOM node of type CDATA.
 */
export const NODETYPE_CDATA = 4;

/**
 * Variable: NODETYPE_ENTITY_REFERENCE
 *
 * DOM node of type ENTITY_REFERENCE.
 */
export const NODETYPE_ENTITY_REFERENCE = 5;

/**
 * Variable: NODETYPE_ENTITY
 *
 * DOM node of type ENTITY.
 */
export const NODETYPE_ENTITY = 6;

/**
 * Variable: NODETYPE_PROCESSING_INSTRUCTION
 *
 * DOM node of type PROCESSING_INSTRUCTION.
 */
export const NODETYPE_PROCESSING_INSTRUCTION = 7;

/**
 * Variable: NODETYPE_COMMENT
 *
 * DOM node of type COMMENT.
 */
export const NODETYPE_COMMENT = 8;

/**
 * Variable: NODETYPE_DOCUMENT
 *
 * DOM node of type DOCUMENT.
 */
export const NODETYPE_DOCUMENT = 9;

/**
 * Variable: NODETYPE_DOCUMENTTYPE
 *
 * DOM node of type DOCUMENTTYPE.
 */
export const NODETYPE_DOCUMENTTYPE = 10;

/**
 * Variable: NODETYPE_DOCUMENT_FRAGMENT
 *
 * DOM node of type DOCUMENT_FRAGMENT.
 */
export const NODETYPE_DOCUMENT_FRAGMENT = 11;

/**
 * Variable: NODETYPE_NOTATION
 *
 * DOM node of type NOTATION.
 */
export const NODETYPE_NOTATION = 12;

/**
 * Variable: TOOLTIP_VERTICAL_OFFSET
 *
 * Defines the vertical offset for the tooltip.
 * Default is 16.
 */
export const TOOLTIP_VERTICAL_OFFSET = 16;

/**
 * Variable: DEFAULT_VALID_COLOR
 *
 * Specifies the default valid color. Default is #0000FF.
 */
export const DEFAULT_VALID_COLOR = '#00FF00';

/**
 * Variable: DEFAULT_INVALID_COLOR
 *
 * Specifies the default invalid color. Default is #FF0000.
 */
export const DEFAULT_INVALID_COLOR = '#FF0000';

/**
 * Variable: OUTLINE_HIGHLIGHT_COLOR
 *
 * Specifies the default highlight color for shape outlines.
 * Default is #0000FF. This is used in <mxEdgeHandler>.
 */
export const OUTLINE_HIGHLIGHT_COLOR = '#00FF00';

/**
 * Variable: OUTLINE_HIGHLIGHT_COLOR
 *
 * Defines the strokewidth to be used for shape outlines.
 * Default is 5. This is used in <mxEdgeHandler>.
 */
export const OUTLINE_HIGHLIGHT_STROKEWIDTH = 5;

/**
 * Variable: HIGHLIGHT_STROKEWIDTH
 *
 * Defines the strokewidth to be used for the highlights.
 * Default is 3.
 */
export const HIGHLIGHT_STROKEWIDTH = 3;

/**
 * Variable: CONSTRAINT_HIGHLIGHT_SIZE
 *
 * Size of the constraint highlight (in px). Default is 2.
 */
export const HIGHLIGHT_SIZE = 2;

/**
 * Variable: HIGHLIGHT_OPACITY
 *
 * Opacity (in %) used for the highlights (including outline).
 * Default is 100.
 */
export const HIGHLIGHT_OPACITY = 100;

/**
 * Variable: CURSOR_MOVABLE_VERTEX
 *
 * Defines the cursor for a movable vertex. Default is 'move'.
 */
export const CURSOR_MOVABLE_VERTEX = 'move';

/**
 * Variable: CURSOR_MOVABLE_EDGE
 *
 * Defines the cursor for a movable edge. Default is 'move'.
 */
export const CURSOR_MOVABLE_EDGE = 'move';

/**
 * Variable: CURSOR_LABEL_HANDLE
 *
 * Defines the cursor for a movable label. Default is 'default'.
 */
export const CURSOR_LABEL_HANDLE = 'default';

/**
 * Variable: CURSOR_TERMINAL_HANDLE
 *
 * Defines the cursor for a terminal handle. Default is 'pointer'.
 */
export const CURSOR_TERMINAL_HANDLE = 'pointer';

/**
 * Variable: CURSOR_BEND_HANDLE
 *
 * Defines the cursor for a movable bend. Default is 'crosshair'.
 */
export const CURSOR_BEND_HANDLE = 'crosshair';

/**
 * Variable: CURSOR_VIRTUAL_BEND_HANDLE
 *
 * Defines the cursor for a movable bend. Default is 'crosshair'.
 */
export const CURSOR_VIRTUAL_BEND_HANDLE = 'crosshair';

/**
 * Variable: CURSOR_CONNECT
 *
 * Defines the cursor for a connectable state. Default is 'pointer'.
 */
export const CURSOR_CONNECT = 'pointer';

/**
 * Variable: HIGHLIGHT_COLOR
 *
 * Defines the color to be used for the cell highlighting.
 * Use 'none' for no color. Default is #00FF00.
 */
export const HIGHLIGHT_COLOR = '#00FF00';

/**
 * Variable: TARGET_HIGHLIGHT_COLOR
 *
 * Defines the color to be used for highlighting a target cell for a new
 * or changed connection. Note that this may be either a source or
 * target terminal in the graph. Use 'none' for no color.
 * Default is #0000FF.
 */
export const CONNECT_TARGET_COLOR = '#0000FF';

/**
 * Variable: INVALID_CONNECT_TARGET_COLOR
 *
 * Defines the color to be used for highlighting a invalid target cells
 * for a new or changed connections. Note that this may be either a source
 * or target terminal in the graph. Use 'none' for no color. Default is
 * #FF0000.
 */
export const INVALID_CONNECT_TARGET_COLOR = '#FF0000';

/**
 * Variable: DROP_TARGET_COLOR
 *
 * Defines the color to be used for the highlighting target parent cells
 * (for drag and drop). Use 'none' for no color. Default is #0000FF.
 */
export const DROP_TARGET_COLOR = '#0000FF';

/**
 * Variable: VALID_COLOR
 *
 * Defines the color to be used for the coloring valid connection
 * previews. Use 'none' for no color. Default is #FF0000.
 */
export const VALID_COLOR = '#00FF00';

/**
 * Variable: INVALID_COLOR
 *
 * Defines the color to be used for the coloring invalid connection
 * previews. Use 'none' for no color. Default is #FF0000.
 */
export const INVALID_COLOR = '#FF0000';

/**
 * Variable: EDGE_SELECTION_COLOR
 *
 * Defines the color to be used for the selection border of edges. Use
 * 'none' for no color. Default is #00FF00.
 */
export const EDGE_SELECTION_COLOR = '#00FF00';

/**
 * Variable: VERTEX_SELECTION_COLOR
 *
 * Defines the color to be used for the selection border of vertices. Use
 * 'none' for no color. Default is #00FF00.
 */
export const VERTEX_SELECTION_COLOR = '#00FF00';

/**
 * Variable: VERTEX_SELECTION_STROKEWIDTH
 *
 * Defines the strokewidth to be used for vertex selections.
 * Default is 1.
 */
export const VERTEX_SELECTION_STROKEWIDTH = 1;

/**
 * Variable: EDGE_SELECTION_STROKEWIDTH
 *
 * Defines the strokewidth to be used for edge selections.
 * Default is 1.
 */
export const EDGE_SELECTION_STROKEWIDTH = 1;

/**
 * Variable: SELECTION_DASHED
 *
 * Defines the dashed state to be used for the vertex selection
 * border. Default is true.
 */
export const VERTEX_SELECTION_DASHED = true;

/**
 * Variable: SELECTION_DASHED
 *
 * Defines the dashed state to be used for the edge selection
 * border. Default is true.
 */
export const EDGE_SELECTION_DASHED = true;

/**
 * Variable: GUIDE_COLOR
 *
 * Defines the color to be used for the guidelines in mxGraphHandler.
 * Default is #FF0000.
 */
export const GUIDE_COLOR = '#FF0000';

/**
 * Variable: GUIDE_STROKEWIDTH
 *
 * Defines the strokewidth to be used for the guidelines in mxGraphHandler.
 * Default is 1.
 */
export const GUIDE_STROKEWIDTH = 1;

/**
 * Variable: OUTLINE_COLOR
 *
 * Defines the color to be used for the outline rectangle
 * border.  Use 'none' for no color. Default is #0099FF.
 */
export const OUTLINE_COLOR = '#0099FF';

/**
 * Variable: OUTLINE_STROKEWIDTH
 *
 * Defines the strokewidth to be used for the outline rectangle
 * stroke width. Default is 3.
 */
export const OUTLINE_STROKEWIDTH = 3;

/**
 * Variable: HANDLE_SIZE
 *
 * Defines the default size for handles. Default is 6.
 */
export const HANDLE_SIZE = 6;

/**
 * Variable: LABEL_HANDLE_SIZE
 *
 * Defines the default size for label handles. Default is 4.
 */
export const LABEL_HANDLE_SIZE = 4;

/**
 * Variable: HANDLE_FILLCOLOR
 *
 * Defines the color to be used for the handle fill color. Use 'none' for
 * no color. Default is #00FF00 (green).
 */
export const HANDLE_FILLCOLOR = '#00FF00';

/**
 * Variable: HANDLE_STROKECOLOR
 *
 * Defines the color to be used for the handle stroke color. Use 'none' for
 * no color. Default is black.
 */
export const HANDLE_STROKECOLOR = 'black';

/**
 * Variable: LABEL_HANDLE_FILLCOLOR
 *
 * Defines the color to be used for the label handle fill color. Use 'none'
 * for no color. Default is yellow.
 */
export const LABEL_HANDLE_FILLCOLOR = 'yellow';

/**
 * Variable: CONNECT_HANDLE_FILLCOLOR
 *
 * Defines the color to be used for the connect handle fill color. Use
 * 'none' for no color. Default is #0000FF (blue).
 */
export const CONNECT_HANDLE_FILLCOLOR = '#0000FF';

/**
 * Variable: LOCKED_HANDLE_FILLCOLOR
 *
 * Defines the color to be used for the locked handle fill color. Use
 * 'none' for no color. Default is #FF0000 (red).
 */
export const LOCKED_HANDLE_FILLCOLOR = '#FF0000';

/**
 * Variable: OUTLINE_HANDLE_FILLCOLOR
 *
 * Defines the color to be used for the outline sizer fill color. Use
 * 'none' for no color. Default is #00FFFF.
 */
export const OUTLINE_HANDLE_FILLCOLOR = '#00FFFF';

/**
 * Variable: OUTLINE_HANDLE_STROKECOLOR
 *
 * Defines the color to be used for the outline sizer stroke color. Use
 * 'none' for no color. Default is #0033FF.
 */
export const OUTLINE_HANDLE_STROKECOLOR = '#0033FF';

/**
 * Variable: DEFAULT_FONTFAMILY
 *
 * Defines the default family for all fonts. Default is Arial,Helvetica.
 */
export const DEFAULT_FONTFAMILY = 'Arial,Helvetica';

/**
 * Variable: DEFAULT_FONTSIZE
 *
 * Defines the default size (in px). Default is 11.
 */
export const DEFAULT_FONTSIZE = 11;

/**
 * Variable: DEFAULT_TEXT_DIRECTION
 *
 * Defines the default value for the <STYLE_TEXT_DIRECTION> if no value is
 * defined for it in the style. Default value is an empty string which means
 * the default system setting is used and no direction is set.
 */
export const DEFAULT_TEXT_DIRECTION = '';

/**
 * Variable: LINE_HEIGHT
 *
 * Defines the default line height for text labels. Default is 1.2.
 */
export const LINE_HEIGHT = 1.2;

/**
 * Variable: WORD_WRAP
 *
 * Defines the CSS value for the word-wrap property. Default is "normal".
 * Change this to "break-word" to allow long words to be able to be broken
 * and wrap onto the next line.
 */
export const WORD_WRAP = 'normal';

/**
 * Variable: ABSOLUTE_LINE_HEIGHT
 *
 * Specifies if absolute line heights should be used (px) in CSS. Default
 * is false. Set this to true for backwards compatibility.
 */
export const ABSOLUTE_LINE_HEIGHT = false;

/**
 * Variable: DEFAULT_FONTSTYLE
 *
 * Defines the default style for all fonts. Default is 0. This can be set
 * to any combination of font styles as follows.
 *
 * (code)
 * mxConstants.DEFAULT_FONTSTYLE = mxConstants.FONT_BOLD | mxConstants.FONT_ITALIC;
 * (end)
 */
export const DEFAULT_FONTSTYLE = 0;

/**
 * Variable: DEFAULT_STARTSIZE
 *
 * Defines the default start size for swimlanes. Default is 40.
 */
export const DEFAULT_STARTSIZE = 40;

/**
 * Variable: DEFAULT_MARKERSIZE
 *
 * Defines the default size for all markers. Default is 6.
 */
export const DEFAULT_MARKERSIZE = 6;

/**
 * Variable: DEFAULT_IMAGESIZE
 *
 * Defines the default width and height for images used in the
 * label shape. Default is 24.
 */
export const DEFAULT_IMAGESIZE = 24;

/**
 * Variable: ENTITY_SEGMENT
 *
 * Defines the length of the horizontal segment of an Entity Relation.
 * This can be overridden using <'segment'> style.
 * Default is 30.
 */
export const ENTITY_SEGMENT = 30;

/**
 * Variable: RECTANGLE_ROUNDING_FACTOR
 *
 * Defines the rounding factor for rounded rectangles in percent between
 * 0 and 1. Values should be smaller than 0.5. Default is 0.15.
 */
export const RECTANGLE_ROUNDING_FACTOR = 0.15;

/**
 * Variable: LINE_ARCSIZE
 *
 * Defines the size of the arcs for rounded edges. Default is 20.
 */
export const LINE_ARCSIZE = 20;

/**
 * Variable: ARROW_SPACING
 *
 * Defines the spacing between the arrow shape and its terminals. Default is 0.
 */
export const ARROW_SPACING = 0;

/**
 * Variable: ARROW_WIDTH
 *
 * Defines the width of the arrow shape. Default is 30.
 */
export const ARROW_WIDTH = 30;

/**
 * Variable: ARROW_SIZE
 *
 * Defines the size of the arrowhead in the arrow shape. Default is 30.
 */
export const ARROW_SIZE = 30;

/**
 * Variable: PAGE_FORMAT_A4_PORTRAIT
 *
 * Defines the rectangle for the A4 portrait page format. The dimensions
 * of this page format are 826x1169 pixels.
 */
export const PAGE_FORMAT_A4_PORTRAIT = [0, 0, 827, 1169];

/**
 * Variable: PAGE_FORMAT_A4_PORTRAIT
 *
 * Defines the rectangle for the A4 portrait page format. The dimensions
 * of this page format are 826x1169 pixels.
 */
export const PAGE_FORMAT_A4_LANDSCAPE = [0, 0, 1169, 827];

/**
 * Variable: PAGE_FORMAT_LETTER_PORTRAIT
 *
 * Defines the rectangle for the Letter portrait page format. The
 * dimensions of this page format are 850x1100 pixels.
 */
export const PAGE_FORMAT_LETTER_PORTRAIT = [0, 0, 850, 1100];

/**
 * Variable: PAGE_FORMAT_LETTER_PORTRAIT
 *
 * Defines the rectangle for the Letter portrait page format. The dimensions
 * of this page format are 850x1100 pixels.
 */
export const PAGE_FORMAT_LETTER_LANDSCAPE = [0, 0, 1100, 850];

/**
 * Variable: NONE
 *
 * Defines the value for none. Default is "none".
 */
export const NONE = 'none';

/**
 * Variable: FONT_BOLD
 *
 * Constant for bold fonts. Default is 1.
 */
export const FONT_BOLD = 1;

/**
 * Variable: FONT_ITALIC
 *
 * Constant for italic fonts. Default is 2.
 */
export const FONT_ITALIC = 2;

/**
 * Variable: FONT_UNDERLINE
 *
 * Constant for underlined fonts. Default is 4.
 */
export const FONT_UNDERLINE = 4;

/**
 * Variable: FONT_STRIKETHROUGH
 *
 * Constant for strikthrough fonts. Default is 8.
 */
export const FONT_STRIKETHROUGH = 8;

/**
 * Variable: SHAPE_RECTANGLE
 *
 * Name under which <mxRectangleShape> is registered in <mxCellRenderer>.
 * Default is rectangle.
 */
export const SHAPE_RECTANGLE = 'rectangle';

/**
 * Variable: SHAPE_ELLIPSE
 *
 * Name under which <mxEllipse> is registered in <mxCellRenderer>.
 * Default is ellipse.
 */
export const SHAPE_ELLIPSE = 'ellipse';

/**
 * Variable: SHAPE_DOUBLE_ELLIPSE
 *
 * Name under which <mxDoubleEllipse> is registered in <mxCellRenderer>.
 * Default is doubleEllipse.
 */
export const SHAPE_DOUBLE_ELLIPSE = 'doubleEllipse';

/**
 * Variable: SHAPE_RHOMBUS
 *
 * Name under which <mxRhombus> is registered in <mxCellRenderer>.
 * Default is rhombus.
 */
export const SHAPE_RHOMBUS = 'rhombus';

/**
 * Variable: SHAPE_LINE
 *
 * Name under which <mxLine> is registered in <mxCellRenderer>.
 * Default is line.
 */
export const SHAPE_LINE = 'line';

/**
 * Variable: SHAPE_IMAGE
 *
 * Name under which <mxImageShape> is registered in <mxCellRenderer>.
 * Default is image.
 */
export const SHAPE_IMAGE = 'image';

/**
 * Variable: SHAPE_ARROW
 *
 * Name under which <mxArrow> is registered in <mxCellRenderer>.
 * Default is arrow.
 */
export const SHAPE_ARROW = 'arrow';

/**
 * Variable: SHAPE_ARROW_CONNECTOR
 *
 * Name under which <mxArrowConnector> is registered in <mxCellRenderer>.
 * Default is arrowConnector.
 */
export const SHAPE_ARROW_CONNECTOR = 'arrowConnector';

/**
 * Variable: SHAPE_LABEL
 *
 * Name under which <mxLabel> is registered in <mxCellRenderer>.
 * Default is label.
 */
export const SHAPE_LABEL = 'label';

/**
 * Variable: SHAPE_CYLINDER
 *
 * Name under which <mxCylinder> is registered in <mxCellRenderer>.
 * Default is cylinder.
 */
export const SHAPE_CYLINDER = 'cylinder';

/**
 * Variable: SHAPE_SWIMLANE
 *
 * Name under which <mxSwimlane> is registered in <mxCellRenderer>.
 * Default is swimlane.
 */
export const SHAPE_SWIMLANE = 'swimlane';

/**
 * Variable: SHAPE_CONNECTOR
 *
 * Name under which <mxConnector> is registered in <mxCellRenderer>.
 * Default is connector.
 */
export const SHAPE_CONNECTOR = 'connector';

/**
 * Variable: SHAPE_ACTOR
 *
 * Name under which <mxActor> is registered in <mxCellRenderer>.
 * Default is actor.
 */
export const SHAPE_ACTOR = 'actor';

/**
 * Variable: SHAPE_CLOUD
 *
 * Name under which <mxCloud> is registered in <mxCellRenderer>.
 * Default is cloud.
 */
export const SHAPE_CLOUD = 'cloud';

/**
 * Variable: SHAPE_TRIANGLE
 *
 * Name under which <mxTriangle> is registered in <mxCellRenderer>.
 * Default is triangle.
 */
export const SHAPE_TRIANGLE = 'triangle';

/**
 * Variable: SHAPE_HEXAGON
 *
 * Name under which <mxHexagon> is registered in <mxCellRenderer>.
 * Default is hexagon.
 */
export const SHAPE_HEXAGON = 'hexagon';

/**
 * Variable: ARROW_CLASSIC
 *
 * Constant for classic arrow markers.
 */
export const ARROW_CLASSIC = 'classic';

/**
 * Variable: ARROW_CLASSIC_THIN
 *
 * Constant for thin classic arrow markers.
 */
export const ARROW_CLASSIC_THIN = 'classicThin';

/**
 * Variable: ARROW_BLOCK
 *
 * Constant for block arrow markers.
 */
export const ARROW_BLOCK = 'block';

/**
 * Variable: ARROW_BLOCK_THIN
 *
 * Constant for thin block arrow markers.
 */
export const ARROW_BLOCK_THIN = 'blockThin';

/**
 * Variable: ARROW_OPEN
 *
 * Constant for open arrow markers.
 */
export const ARROW_OPEN = 'open';

/**
 * Variable: ARROW_OPEN_THIN
 *
 * Constant for thin open arrow markers.
 */
export const ARROW_OPEN_THIN = 'openThin';

/**
 * Variable: ARROW_OVAL
 *
 * Constant for oval arrow markers.
 */
export const ARROW_OVAL = 'oval';

/**
 * Variable: ARROW_DIAMOND
 *
 * Constant for diamond arrow markers.
 */
export const ARROW_DIAMOND = 'diamond';

/**
 * Variable: ARROW_DIAMOND_THIN
 *
 * Constant for thin diamond arrow markers.
 */
export const ARROW_DIAMOND_THIN = 'diamondThin';

/**
 * Variable: ALIGN_LEFT
 *
 * Constant for left horizontal alignment. Default is left.
 */
export const ALIGN_LEFT = 'left';

/**
 * Variable: ALIGN_CENTER
 *
 * Constant for center horizontal alignment. Default is center.
 */
export const ALIGN_CENTER = 'center';

/**
 * Variable: ALIGN_RIGHT
 *
 * Constant for right horizontal alignment. Default is right.
 */
export const ALIGN_RIGHT = 'right';

/**
 * Variable: ALIGN_TOP
 *
 * Constant for top vertical alignment. Default is top.
 */
export const ALIGN_TOP = 'top';

/**
 * Variable: ALIGN_MIDDLE
 *
 * Constant for middle vertical alignment. Default is middle.
 */
export const ALIGN_MIDDLE = 'middle';

/**
 * Variable: ALIGN_BOTTOM
 *
 * Constant for bottom vertical alignment. Default is bottom.
 */
export const ALIGN_BOTTOM = 'bottom';

/**
 * Variable: DIRECTION_NORTH
 *
 * Constant for direction north. Default is north.
 */
export const DIRECTION_NORTH = 'north';

/**
 * Variable: DIRECTION_SOUTH
 *
 * Constant for direction south. Default is south.
 */
export const DIRECTION_SOUTH = 'south';

/**
 * Variable: DIRECTION_EAST
 *
 * Constant for direction east. Default is east.
 */
export const DIRECTION_EAST = 'east';

/**
 * Variable: DIRECTION_WEST
 *
 * Constant for direction west. Default is west.
 */
export const DIRECTION_WEST = 'west';

/**
 * Variable: TEXT_DIRECTION_DEFAULT
 *
 * Constant for text direction default. Default is an empty string. Use
 * this value to use the default text direction of the operating system.
 */
export const TEXT_DIRECTION_DEFAULT = '';

/**
 * Variable: TEXT_DIRECTION_AUTO
 *
 * Constant for text direction automatic. Default is auto. Use this value
 * to find the direction for a given text with <mxText.getAutoDirection>.
 */
export const TEXT_DIRECTION_AUTO = 'auto';

/**
 * Variable: TEXT_DIRECTION_LTR
 *
 * Constant for text direction left to right. Default is ltr. Use this
 * value for left to right text direction.
 */
export const TEXT_DIRECTION_LTR = 'ltr';

/**
 * Variable: TEXT_DIRECTION_RTL
 *
 * Constant for text direction right to left. Default is rtl. Use this
 * value for right to left text direction.
 */
export const TEXT_DIRECTION_RTL = 'rtl';

/**
 * Variable: DIRECTION_MASK_NONE
 *
 * Constant for no direction.
 */
export const DIRECTION_MASK_NONE = 0;

/**
 * Variable: DIRECTION_MASK_WEST
 *
 * Bitwise mask for west direction.
 */
export const DIRECTION_MASK_WEST = 1;

/**
 * Variable: DIRECTION_MASK_NORTH
 *
 * Bitwise mask for north direction.
 */
export const DIRECTION_MASK_NORTH = 2;

/**
 * Variable: DIRECTION_MASK_SOUTH
 *
 * Bitwise mask for south direction.
 */
export const DIRECTION_MASK_SOUTH = 4;

/**
 * Variable: DIRECTION_MASK_EAST
 *
 * Bitwise mask for east direction.
 */
export const DIRECTION_MASK_EAST = 8;

/**
 * Variable: DIRECTION_MASK_ALL
 *
 * Bitwise mask for all directions.
 */
export const DIRECTION_MASK_ALL = 15;

/**
 * Variable: ELBOW_VERTICAL
 *
 * Constant for elbow vertical. Default is horizontal.
 */
export const ELBOW_VERTICAL = 'vertical';

/**
 * Variable: ELBOW_HORIZONTAL
 *
 * Constant for elbow horizontal. Default is horizontal.
 */
export const ELBOW_HORIZONTAL = 'horizontal';

/**
 * Variable: EDGESTYLE_ELBOW
 *
 * Name of the elbow edge style. Can be used as a string value
 * for the STYLE_EDGE style.
 */
export const EDGESTYLE_ELBOW = 'elbowEdgeStyle';

/**
 * Variable: EDGESTYLE_ENTITY_RELATION
 *
 * Name of the entity relation edge style. Can be used as a string value
 * for the STYLE_EDGE style.
 */
export const EDGESTYLE_ENTITY_RELATION = 'entityRelationEdgeStyle';

/**
 * Variable: EDGESTYLE_LOOP
 *
 * Name of the loop edge style. Can be used as a string value
 * for the STYLE_EDGE style.
 */
export const EDGESTYLE_LOOP = 'loopEdgeStyle';

/**
 * Variable: EDGESTYLE_SIDETOSIDE
 *
 * Name of the side to side edge style. Can be used as a string value
 * for the STYLE_EDGE style.
 */
export const EDGESTYLE_SIDETOSIDE = 'sideToSideEdgeStyle';

/**
 * Variable: EDGESTYLE_TOPTOBOTTOM
 *
 * Name of the top to bottom edge style. Can be used as a string value
 * for the STYLE_EDGE style.
 */
export const EDGESTYLE_TOPTOBOTTOM = 'topToBottomEdgeStyle';

/**
 * Variable: EDGESTYLE_ORTHOGONAL
 *
 * Name of the generic orthogonal edge style. Can be used as a string value
 * for the STYLE_EDGE style.
 */
export const EDGESTYLE_ORTHOGONAL = 'orthogonalEdgeStyle';

/**
 * Variable: EDGESTYLE_SEGMENT
 *
 * Name of the generic segment edge style. Can be used as a string value
 * for the STYLE_EDGE style.
 */
export const EDGESTYLE_SEGMENT = 'segmentEdgeStyle';

/**
 * Variable: PERIMETER_ELLIPSE
 *
 * Name of the ellipse perimeter. Can be used as a string value
 * for the STYLE_PERIMETER style.
 */
export const PERIMETER_ELLIPSE = 'ellipsePerimeter';

/**
 * Variable: PERIMETER_RECTANGLE
 *
 * Name of the rectangle perimeter. Can be used as a string value
 * for the STYLE_PERIMETER style.
 */
export const PERIMETER_RECTANGLE = 'rectanglePerimeter';

/**
 * Variable: PERIMETER_RHOMBUS
 *
 * Name of the rhombus perimeter. Can be used as a string value
 * for the STYLE_PERIMETER style.
 */
export const PERIMETER_RHOMBUS = 'rhombusPerimeter';

/**
 * Variable: PERIMETER_HEXAGON
 *
 * Name of the hexagon perimeter. Can be used as a string value
 * for the STYLE_PERIMETER style.
 */
export const PERIMETER_HEXAGON = 'hexagonPerimeter';

/**
 * Variable: PERIMETER_TRIANGLE
 *
 * Name of the triangle perimeter. Can be used as a string value
 * for the STYLE_PERIMETER style.
 */
export const PERIMETER_TRIANGLE = 'trianglePerimeter';
