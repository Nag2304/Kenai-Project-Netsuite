/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
/*global define,log*/
define(['N/ui/serverWidget'], (serverWidget) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  /* ------------------------ Global Variables - End ------------------------ */
  //
  /* --------------------------- before Load - Begin -------------------------- */
  const beforeLoad = (context) => {
    const strLoggerTitle = 'Before Load';
    try {
      // Warning: This approach requires direct DOM manipulation which NetSuite
      // may deprecate in a future release, possibly causing this code to break (see Answer Id: 10085).
      context.form.addField({
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
      log.debug(strLoggerTitle,'Successfully executed');
    } catch (error) {
      log.error(strLoggerTitle + ' caught an exception', error);
    }
  };
  /*
	Note #1: We set the z-index to ensure that the header row stays above 
	the floating action bar and any selected dropdown field in edit mode. 
	In reality, a z-index of 1 is sufficient for this particular scenario.
	However, we use a "very large" value just in case NetSuite changes something 
	in the future with the z-indices of other elements.
	
	Strangely, if we apply the same CSS style to ".uir-machine-headerrow" 
	instead of ".uir-machine-headerrow > td", it does not work as desired!
	In that case, the transform operation overrules the z-index, causing it 
	to default to 0. However, for unclear reason, when the exact same CSS 
	is applied to the "td" elements, the z-index is preserved, hence the current solution.
	
	z-index is quite an involved topic. For more information, visit:
	* https://philipwalton.com/articles/what-no-one-told-you-about-z-index/
	* https://coder-coder.com/z-index-isnt-working/
	* https://stackoverflow.com/questions/20851452/z-index-is-canceled-by-setting-transformrotate
	
	"z-context" is an an excellent Chrome extension for debugging the 
	actual stacking context/stacking order: 
	https://chrome.google.com/webstore/detail/z-context/jigamimbjojkdgnlldajknogfgncplbh?hl=en
*/
  /* ---------------------------- before Load - End --------------------------- */
  //
  /* ------------------------ Exports Begin ------------------------ */
  exports.beforeLoad = beforeLoad;
  return exports;
  /* ------------------------ Exportst End ------------------------ */
});
