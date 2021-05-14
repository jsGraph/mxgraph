import mxPoint from './datatypes/mxPoint';
import mxTemporaryCellStates from '../view/cell/mxTemporaryCellStates';
import mxCodec from '../serialization/mxCodec';
import { DIALECT_SVG, NS_SVG } from './mxConstants';

/**
 * Function: createXmlDocument
 *
 * Returns a new, empty XML document.
 */
export const createXmlDocument = () => {
  let doc = null;

  if (document.implementation && document.implementation.createDocument) {
    doc = document.implementation.createDocument('', '', null);
  } else if ('ActiveXObject' in window) {
    doc = mxUtils.createMsXmlDocument();
  }

  return doc;
};

/**
 * Function: createMsXmlDocument
 *
 * Returns a new, empty Microsoft.XMLDOM document using ActiveXObject.
 */
export const createMsXmlDocument = () => {
  const doc = new ActiveXObject('Microsoft.XMLDOM');
  doc.async = false;

  // Workaround for parsing errors with SVG DTD
  doc.validateOnParse = false;
  doc.resolveExternals = false;

  return doc;
};

/**
 * Function: parseXml
 *
 * Parses the specified XML string into a new XML document and returns the
 * new document.
 *
 * Example:
 *
 * (code)
 * let doc = mxUtils.parseXml(
 *   '<mxGraphModel><root><MyDiagram id="0"><mxCell/></MyDiagram>'+
 *   '<MyLayer id="1"><mxCell parent="0" /></MyLayer><MyObject id="2">'+
 *   '<mxCell style="strokeColor=blue;fillColor=red" parent="1" vertex="1">'+
 *   '<mxGeometry x="10" y="10" width="80" height="30" as="geometry"/>'+
 *   '</mxCell></MyObject></root></mxGraphModel>');
 * (end)
 *
 * Parameters:
 *
 * xml - String that contains the XML data.
 */
export const parseXml = (xml) => {
  const parser = new DOMParser();
  return parser.parseFromString(xml, 'text/xml');
};

/**
 * Function: getViewXml
 */
export const getViewXml = (graph, scale, cells, x0, y0) => {
  x0 = x0 != null ? x0 : 0;
  y0 = y0 != null ? y0 : 0;
  scale = scale != null ? scale : 1;

  if (cells == null) {
    const model = graph.getModel();
    cells = [model.getRoot()];
  }

  const view = graph.getView();
  let result = null;

  // Disables events on the view
  const eventsEnabled = view.isEventsEnabled();
  view.setEventsEnabled(false);

  // Workaround for label bounds not taken into account for image export.
  // Creates a temporary draw pane which is used for rendering the text.
  // Text rendering is required for finding the bounds of the labels.
  const { drawPane } = view;
  const { overlayPane } = view;

  if (graph.dialect === DIALECT_SVG) {
    view.drawPane = document.createElementNS(NS_SVG, 'g');
    view.canvas.appendChild(view.drawPane);

    // Redirects cell overlays into temporary container
    view.overlayPane = document.createElementNS(NS_SVG, 'g');
    view.canvas.appendChild(view.overlayPane);
  } else {
    view.drawPane = view.drawPane.cloneNode(false);
    view.canvas.appendChild(view.drawPane);

    // Redirects cell overlays into temporary container
    view.overlayPane = view.overlayPane.cloneNode(false);
    view.canvas.appendChild(view.overlayPane);
  }

  // Resets the translation
  const translate = view.getTranslate();
  view.translate = new mxPoint(x0, y0);

  // Creates the temporary cell states in the view
  const temp = new mxTemporaryCellStates(graph.getView(), scale, cells);

  try {
    const enc = new mxCodec();
    result = enc.encode(graph.getView());
  } finally {
    temp.destroy();
    view.translate = translate;
    view.canvas.removeChild(view.drawPane);
    view.canvas.removeChild(view.overlayPane);
    view.drawPane = drawPane;
    view.overlayPane = overlayPane;
    view.setEventsEnabled(eventsEnabled);
  }

  return result;
};

/**
 * Function: getXml
 *
 * Returns the XML content of the specified node. For Internet Explorer,
 * all \r\n\t[\t]* are removed from the XML string and the remaining \r\n
 * are replaced by \n. All \n are then replaced with linefeed, or &#xa; if
 * no linefeed is defined.
 *
 * Parameters:
 *
 * node - DOM node to return the XML for.
 * linefeed - Optional string that linefeeds are converted into. Default is
 * &#xa;
 */
export const getXml = (node, linefeed) => {
  let xml = '';

  if (window.XMLSerializer != null) {
    const xmlSerializer = new XMLSerializer();
    xml = xmlSerializer.serializeToString(node);
  } else if (node.xml != null) {
    xml = node.xml
      .replace(/\r\n\t[\t]*/g, '')
      .replace(/>\r\n/g, '>')
      .replace(/\r\n/g, '\n');
  }

  // Replaces linefeeds with HTML Entities.
  linefeed = linefeed || '&#xa;';
  xml = xml.replace(/\n/g, linefeed);

  return xml;
};

/**
 * Function: getPrettyXML
 *
 * Returns a pretty printed string that represents the XML tree for the
 * given node. This method should only be used to print XML for reading,
 * use <getXml> instead to obtain a string for processing.
 *
 * Parameters:
 *
 * node - DOM node to return the XML for.
 * tab - Optional string that specifies the indentation for one level.
 * Default is two spaces.
 * indent - Optional string that represents the current indentation.
 * Default is an empty string.
 * newline - Option string that represents a linefeed. Default is '\n'.
 */
export const getPrettyXml = (node, tab, indent, newline, ns) => {
  const result = [];

  if (node != null) {
    tab = tab != null ? tab : '  ';
    indent = indent != null ? indent : '';
    newline = newline != null ? newline : '\n';

    if (node.namespaceURI != null && node.namespaceURI !== ns) {
      ns = node.namespaceURI;

      if (node.getAttribute('xmlns') == null) {
        node.setAttribute('xmlns', node.namespaceURI);
      }
    }

    if (node.nodeType === NODETYPE_DOCUMENT) {
      result.push(
        mxUtils.getPrettyXml(node.documentElement, tab, indent, newline, ns)
      );
    } else if (node.nodeType === NODETYPE_DOCUMENT_FRAGMENT) {
      let tmp = node.firstChild;

      if (tmp != null) {
        while (tmp != null) {
          result.push(mxUtils.getPrettyXml(tmp, tab, indent, newline, ns));
          tmp = tmp.nextSibling;
        }
      }
    } else if (node.nodeType === NODETYPE_COMMENT) {
      const value = getTextContent(node);

      if (value.length > 0) {
        result.push(`${indent}<!--${value}-->${newline}`);
      }
    } else if (node.nodeType === NODETYPE_TEXT) {
      const value = trim(getTextContent(node));

      if (value.length > 0) {
        result.push(indent + htmlEntities(value, false) + newline);
      }
    } else if (node.nodeType === NODETYPE_CDATA) {
      const value = getTextContent(node);

      if (value.length > 0) {
        result.push(`${indent}<![CDATA[${value}]]${newline}`);
      }
    } else {
      result.push(`${indent}<${node.nodeName}`);

      // Creates the string with the node attributes
      // and converts all HTML entities in the values
      const attrs = node.attributes;

      if (attrs != null) {
        for (let i = 0; i < attrs.length; i += 1) {
          const val = htmlEntities(attrs[i].value);
          result.push(` ${attrs[i].nodeName}="${val}"`);
        }
      }

      // Recursively creates the XML string for each child
      // node and appends it here with an indentation
      let tmp = node.firstChild;

      if (tmp != null) {
        result.push(`>${newline}`);

        while (tmp != null) {
          result.push(
            mxUtils.getPrettyXml(tmp, tab, indent + tab, newline, ns)
          );
          tmp = tmp.nextSibling;
        }

        result.push(`${indent}</${node.nodeName}>${newline}`);
      } else {
        result.push(` />${newline}`);
      }
    }
  }

  return result.join('');
};
