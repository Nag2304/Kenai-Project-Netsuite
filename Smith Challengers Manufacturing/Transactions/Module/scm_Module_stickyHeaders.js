/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name:scm_Module_stickyHeaders.js
 * Author           Date       Version               Remarks
 * nagendrababu  10.17.2024      1.00       Initial creation of the script
 *
 */

/* global define,log */

define(['N/ui/serverWidget'], (serverWidget) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* ------------------------- Sticky Headers - Begin ------------------------- */
  /**
   *
   * @param {object} scriptContext
   * @returns {object}
   */
  const stickyHeaders = (scriptContext) => {
    const loggerTitle = ' Sticky Headers ';
    log.debug(loggerTitle, ' Sticky Headers Module loaded');
    let stickyHeadersObject;
    try {
      stickyHeadersObject = scriptContext.form.addField({
        id: 'custpage_stickyheaders_script',
        label: 'Hidden',
        type: serverWidget.FieldType.INLINEHTML,
      }).defaultValue =
        '<script>' +
        '(function($){' +
        '$(function($, undefined){' +
        '$(".uir-machine-table-container")' + // All NetSuite tables are wrapped in this CSS class
        '.css("max-height", "70vh")' +
        // Make header row sticky.
        '.bind("scroll", (event) => {' +
        '$(event.target).find(".uir-machine-headerrow > td,.uir-list-headerrow > td")' +
        '.css({' +
        '"transform": `translate(0, ${event.target.scrollTop}px)`,' +
        '"z-index": "9999",' + // See Note #1 below
        '"position": "relative"' +
        '});' +
        '})' +
        // Make floating action bar in edit mode sticky.
        '.bind("scroll", (event) => {' +
        '$(".machineButtonRow > table")' +
        '.css("transform", `translate(${event.target.scrollLeft}px)`);' +
        '});' +
        '});' +
        '})(jQuery);' +
        '</script>';
    } catch (error) {
      log.error(loggerTitle + ' caught with an exception', error);
    }
    return stickyHeadersObject;
  };
  /* -------------------------- Sticky Headers - End -------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeLoad = stickyHeaders;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
