/**
 * @NApiVersion 2.x
 * @NScriptType ScheduledScript
 */
define(["N/file", "N/record", "N/log", "N/format", "N/search"], function (
  file,
  record,
  log,
  format,
  search
) {
  const exports = {};
  /* ------------------------- Scheduled Script Begin ------------------------- */
  function execute(context) {
    try {
      /* ------------------------- Looping all the files from the file cabinet folder Begin ------------------------- */
      var filecol = search.createColumn({
        name: "internalid",
        join: "file",
        label: "Internal ID",
      });

      var folderSearchObj = search.create({
        type: "folder",
        filters: [
          ["internalidnumber", "equalto", "131559"], // You need to specifify the folder id here
        ],
        columns: [
          search.createColumn({
            name: "name",
            join: "file",
            label: "Name",
          }),
          filecol,
        ],
      });
      var searchResult = folderSearchObj.run().getRange({
        start: 0,
        end: 1000,
      });

      var result = [];

      for (var m = 0; m < searchResult.length; m++) {
        result.push(searchResult[m].getValue(filecol));
      }
      //log.debug("result", result);

      /* ------------------------- Looping all the files from the filec cabinet folder end ------------------------- */
      //
      if (result.length > 0) {
        /* -------------------------- File Read Loop Begin -------------------------- */
        for (var p = 0; p < result.length; p++) {
          var fileObj;

          fileObj = file.load({
            id: result[p],
          });

          //?log.debug("result-1", [result.length, result]);

          var arrLines = fileObj.getContents().split(/\n|\n\r/);

          /* ----------------- Array and Object Initializations Begin ----------------- */
          var newArr = [];
          var newObj = {};
          /* ----------------- Array and Object Initializations Begin ----------------- */
          //?log.debug({ title: "File Read Successfully", details: [arrLines] });
          /* --------------------------- Items Insert Begin --------------------------- */
          for (var i = 1; i < arrLines.length - 1; i++) {
            arrLines[i] = arrLines[i].replace(
              /\"\d{1,3}\,\d{3}\.\d{1,3}\"/,
              "blank"
            );
            var content = CSVtoArray(arrLines[i]);
            newObj.item = content[0];
            newObj.qty = Number(content[1]);
            newObj.line = i;
            newArr.push(newObj);
            newObj = {};
          }
          /* --------------------------- Items Insert End --------------------------- */
          //
          /* ------------------------------- Loop Begin ------------------------------- */
          //*loop to get all lines
          for (var i = 1; i < arrLines.length - 1; i++) {
            arrLines[i] = arrLines[i].replace(
              /\"\d{1,3}\,\d{3}\.\d{1,3}\"/,
              "blank"
            );
            var content = CSVtoArray(arrLines[i]);
            //?log.debug({ title: "File Split Successfully", details: content });

            // add the columns of the CSV file here
            var attention = content[2];
            /* ------------------------------- Date Begin ------------------------------- */
            var date = content[3];
            var formatteddate = format.parse({
              value: date,
              type: format.Type.DATE,
            });
            /* ------------------------------- Date End ------------------------------- */
            var custPONumber = content[4];
            var addressee = content[5];
            var address2 = content[7];
            var address1 = content[6];
            var city = content[8];
            var zip = content[9];
            var country = content[10];
            var customer = Number(content[11]);
            /*log.debug({
            title: "Individual Contents",
            details: [
              sku,
              qty,
              attention,
              date,
              custPONumber,
              addressee,
              address2,
              address1,
              city,
              zip,
              country,
              customer,
            ],
          });*/
            /* --------------------- Create Sales Order Record Begin -------------------- */
            var soRecord = record.create({
              type: record.Type.SALES_ORDER,
              isDynamic: true,
            });

            //EDI PROCESSED
            soRecord.setValue({
              fieldId: "custbody5",
              value: true,
            });
            // CUSTOMER
            if (customer) {
              soRecord.setValue({
                fieldId: "entity",
                value: customer,
              });
              //?log.debug("entity id", customer);
              var custRec = record.load({
                type: record.Type.CUSTOMER,
                id: customer,
                isDynamic: true,
              });
              var custLocation = custRec.getValue({
                fieldId: "custentity2",
              });
              //LOCATION
              soRecord.setValue({
                fieldId: "location",
                value: custLocation,
              });
            }

            // * Set Default to pending approval.
            soRecord.setValue({
              fieldId: "orderstatus",
              value: "A",
            });
            // DATE
            if (formatteddate) {
              soRecord.setValue({
                fieldId: "trandate",
                value: formatteddate,
              });
            }
            // CUST PO NUMBER
            if (custPONumber) {
              soRecord.setValue({
                fieldId: "custbody1",
                value: custPONumber,
              });
            }

            /* ------------------------- Shipping Address Begin ------------------------- */
            var subrecord = soRecord.getSubrecord({
              fieldId: "shippingaddress",
            });
            // SHIP COUNTRY
            if (country) {
              var rec = record.create({
                type: "customrecord_alternate_country",
                isDynamic: true,
              });

              var countryField = rec.getField({
                fieldId: "custrecord_country_list",
              });

              var countryOptions = countryField.getSelectOptions();
              for (i in countryOptions) {
                var id = countryOptions[i].value;
                var text = countryOptions[i].text;
                // log.debug({
                //   title: "details",
                //   details: [id, text, countryOptions],
                // });
                if (text == country) {
                  if (text == "France") {
                    var newCountry = "FR";
                  } else if (text == "United States") {
                    var newCountry = "US";
                  } else if (text == "Italy") {
                    var newCountry = "IT";
                  }
                }
              }
              subrecord.setValue({
                fieldId: "country",
                value: newCountry,
              });
            }

            // ADDRESSEE
            if (addressee) {
              subrecord.setValue({
                fieldId: "addressee",
                value: addressee,
              });
            }

            // ATTENTION
            if (attention) {
              subrecord.setValue({
                fieldId: "attention",
                value: attention,
              });
            }

            // SHIP ADDRESS 1
            if (address1) {
              subrecord.setValue({
                fieldId: "addr1",
                value: address1,
              });
            }

            // SHIP ADDRESS 2
            if (address2) {
              subrecord.setValue({
                fieldId: "addr2",
                value: address2,
              });
            }

            // SHIP CITY
            if (city) {
              subrecord.setValue({
                fieldId: "city",
                value: city,
              });
            }

            // SHIP ZIP
            if (zip) {
              subrecord.setValue({
                fieldId: "zip",
                value: zip,
              });
            }
            /* ------------------------- Shipping Address End ------------------------- */
            //
            /* ------------------------ Internal Item Loop Begin ------------------------ */
            for (var j = 0; j < newArr.length; j++) {
              var sku = newArr[j].item;
              var qty = newArr[j].qty;
              /* ------------------------------- Item Begin ------------------------------- */
              soRecord.selectNewLine({
                sublistId: "item",
              });

              // QUANTITY
              if (qty) {
                soRecord.setCurrentSublistValue({
                  sublistId: "item",
                  fieldId: "quantity",
                  value: qty,
                });
              }
              // ITEM ID
              if (sku) {
                /* ---------------------------- Create Search Begin --------------------------- */
                var searchobj = search.create({
                  type: "item",
                  filters: [["name", "is", [sku]]],
                  columns: [
                    search.createColumn({
                      name: "internalid",
                      label: "Internal ID",
                    }),
                  ],
                });
                /* ---------------------------- Create Search End --------------------------- */
                //
                /* ---------------------------- Count Search Begin ---------------------------- */
                var searchResultCount = searchobj.runPaged().count;
                /* ---------------------------- Count Search End ---------------------------- */
                //
                if (searchResultCount > 0) {
                  searchobj.run().each(function (result) {
                    var itemInternalId = result.getValue("internalid");
                    soRecord.setCurrentSublistValue({
                      sublistId: "item",
                      fieldId: "item",
                      value: itemInternalId,
                    });
                    return true;
                  });
                } else {
                  continue;
                }
              }

              soRecord.commitLine({
                sublistId: "item",
              });
              /* -------------------------------- Item End -------------------------------- */
            }
            /* ------------------------ Internal Item Loop End ------------------------ */
            var recordID = soRecord.save();
            /* --------------------- Create Sales Order Record End -------------------- */
            break;
          }
          log.debug({
            title: "New sales Order list",
            details: recordID,
          });
          /* -------------------------------- Loop End -------------------------------- */
          //
        }
        /* -------------------------- File Read Loop End -------------------------- */
        //
        /* ------------------------- File Create Loop Begin ------------------------- */
        for (var s = 0; s < result.length; s++) {
          var fileObj;

          fileObj = file.load({
            id: result[s],
          });
          /* ---------------------------- File Rename Begin --------------------------- */
          var currentFileName = fileObj.name.split(".");
          var d = new Date();
          var day = d.getDate();
          var month = d.getMonth();
          var year = d.getFullYear();
          var time = d.getTime();
          var concateddate = [day, month, year, time].join("_");
          var newFileName =
            currentFileName[0] + "_" + concateddate + "." + currentFileName[1];
          /* ----------------------------- File Rename End ---------------------------- */
          //
          fileObj.name = newFileName;
          var fileId = Number(fileObj.save());
          //?log.debug({ title: "File ID", details: fileId });
          // Copy the file after completion
          file.copy({
            id: fileId,
            folder: 131560,
          });
          //Delete the file after copy
          file.delete({
            id: fileId,
          });
        }
        /* ------------------------- File Create Loop End ------------------------- */
      } else {
        log.debug({
          title: "No files to read in the file cabinet",
          details: result,
        });
      }
    } catch (err) {
      log.debug({
        title: "Error Occured",
        details: err,
      });
    }
  }
  /* ------------------------- Scheduled Script End ------------------------- */
  //
  /* ----------------------------- CSV Split Begin ---------------------------- */
  function CSVtoArray(text) {
    var re_valid =
      /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
    var re_value =
      /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;

    // Return NULL if input string is not well formed CSV string.
    if (!re_valid.test(text)) return null;

    var a = []; // Initialize array to receive values.
    text.replace(
      re_value, // "Walk" the string using replace with callback.
      function (m0, m1, m2, m3) {
        // Remove backslash from \' in single quoted values.
        if (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
        // Remove backslash from \" in double quoted values.
        else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
        else if (m3 !== undefined) a.push(m3);
        return ""; // Return empty string.
      }
    );

    // Handle special case of empty last value.
    if (/,\s*$/.test(text)) a.push("");
    return a;
  }
  /* ------------------------------ CSV Split End ----------------------------- */
  //
  /* ------------------------------ Exports Begin ----------------------------- */
  exports.execute = execute;
  return exports;
  /* ------------------------------ Exports End ----------------------------- */
});
