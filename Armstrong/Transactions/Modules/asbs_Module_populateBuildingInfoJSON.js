/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/**
 * File name: asbs_Module_populateBuildingInfoJSON.js
 * Author           Date       Version               Remarks
 * nagendrababu   07.19.2025    1.00       Initial creation of the script
 *
 */

/* global define,log */

define(['N/search'], (search) => {
  /* ------------------------ Global Variables - Begin ------------------------ */
  const exports = {};
  const BUILDING_INFO_TYPE = 'customrecord1380'; // Building Info custom record
  const SALES_ORDER_LINK_FIELD = 'custrecord155'; // Field linking to Sales Order
  const TARGET_JSON_FIELD = 'custbody_asbs_building_info_json'; // Field to store JSON on Sales Order
  /* ------------------------- Global Variables - End ------------------------- */
  //
  /* -------------------- populateBuildingInfoJSON - Begin -------------------- */
  /**
   *
   * @param {Object} context
   * @returns
   */
  const populateBuildingInfoJSON = (context) => {
    const loggerTitle = 'Populate Building Info JSON';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    try {
      const newRec = context.newRecord;

      // Fetch sales order internal ID
      const soId = newRec.id || newRec.getValue({ fieldId: 'id' });
      if (!soId) return;

      const buildingInfo = getBuildingInfoForSalesOrder(soId);
      const html = generateBuildingInfoHTML(buildingInfo);

      const currentHtml = newRec.getValue({ fieldId: TARGET_JSON_FIELD }) || '';
      if (currentHtml !== html) {
        newRec.setValue({
          fieldId: TARGET_JSON_FIELD,
          value: html,
        });
      }
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );
    //
  };
  /* -------------------- populateBuildingInfoJSON - End -------------------- */
  //
  /* ------------------------ Helper Functions - Begin ------------------------ */
  /**
   * Fetch building info records linked to the given sales order ID.
   * @param {string|number} salesOrderId
   * @returns {Array<Object>}
   */
  const getBuildingInfoForSalesOrder = (salesOrderId) => {
    const loggerTitle = 'Get Building Info For Sales Order';
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Entry--------------------<|'
    );
    //
    const buildingInfo = [];

    try {
      const buildingSearch = search.create({
        type: BUILDING_INFO_TYPE,
        filters: [[SALES_ORDER_LINK_FIELD, 'anyof', salesOrderId]],
        columns: [
          'custrecord_width',
          'custrecord_length',
          'custrecord_eave_height',
          'custrecord_roof_pitch',
          'custrecord_code',
          'custrecord_snow_load',
          'custrecord_wind_load',
          'custrecord_roof_panel',
          'custrecord_wall_panel',
          'custrecord_trim',
          'custrecord_wainscot',
        ],
      });

      buildingSearch.run().each((result) => {
        buildingInfo.push({
          width: result.getValue({ name: 'custrecord_width' }),
          length: result.getValue({ name: 'custrecord_length' }),
          eaveHeight: result.getValue({ name: 'custrecord_eave_height' }),
          roofPitch: result.getValue({ name: 'custrecord_roof_pitch' }),
          code: result.getValue({ name: 'custrecord_code' }),
          snowLoad: result.getValue({ name: 'custrecord_snow_load' }),
          windLoad: result.getValue({ name: 'custrecord_wind_load' }),
          roofPanel: result.getValue({ name: 'custrecord_roof_panel' }),
          wallPanel: result.getValue({ name: 'custrecord_wall_panel' }),
          trim: result.getValue({ name: 'custrecord_trim' }),
          wainscot: result.getValue({ name: 'custrecord_wainscot' }),
        });
        return true;
      });
      log.debug(loggerTitle, buildingInfo);
    } catch (error) {
      log.error(`${loggerTitle} caught with an exception`, error);
    }
    //
    log.debug(
      loggerTitle,
      '|>--------------------' + loggerTitle + '-Exit--------------------<|'
    );

    return buildingInfo;
  };
  /**
   * Converts building info records to styled HTML table
   * @param {Array<Object>} records
   * @returns {string}
   */
  const generateBuildingInfoHTML = (records) => {
    if (!records || records.length === 0) return '';

    const rows = records
      .map(
        (b) => `
  <tr>
    <td style="border: 1px solid #000;">${b.eaveHeight || ''}</td>
    <td style="border: 1px solid #000;">${b.length || ''}</td>
    <td style="border: 1px solid #000;">${b.roofPanel || ''}</td>
    <td style="border: 1px solid #000;">${b.roofPitch || ''}</td>
    <td style="border: 1px solid #000;">${b.snowLoad || ''}</td>
    <td style="border: 1px solid #000;">${b.trim || ''}</td>
    <td style="border: 1px solid #000;">${b.wainscot || ''}</td>
  </tr>
`
      )
      .join('');

    return `
  <table style="width:100%; border-collapse: collapse; border: 1px solid #000;" border="1" cellpadding="4">
    <thead>
      <tr style="background-color:#f2f2f2;">
        <th style="border: 1px solid #000;">Eave Height</th>
        <th style="border: 1px solid #000;">Length</th>
        <th style="border: 1px solid #000;">Roof Panel</th>
        <th style="border: 1px solid #000;">Roof Pitch</th>
        <th style="border: 1px solid #000;">Snow Load</th>
        <th style="border: 1px solid #000;">Trim</th>
        <th style="border: 1px solid #000;">Wainscot (if applicable)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
`;
  };
  /* ------------------------- Helper Functions - End ------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.beforeSubmit = populateBuildingInfoJSON;
  return exports;
  /* ------------------------------- Exports End ------------------------------ */
});
