/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([
  "N/error",
  "N/action",
  "N/search",
  "N/currentRecord",
  "N/ui/dialog",
  "N/url",
], function (error, action, search, currentRecord, dialog, url) {
  function pageInit(context) {
    try {
    } catch (erroe) {
      console.log("Error in pageInit:" + error.toString());
    }
  }

  // ALL THE FUCTIONALITY FOR THE BUTTON GTIN12

  function onButtonClick12GTIN() {
    // dialog.alert({
    //   title: "Hello",
    //   message: "You clicked the button!"
    // })
    try {
      var record = currentRecord.get();
      var suiteletURL = url.resolveScript({
        scriptId: "customscript_bcc_sl_item_label",
        deploymentId: "customdeploy_bcc_sl_item_lab",
        // returnExternalUrl: true
      });
      console.log(record);
      window.open(
        suiteletURL + "&internalid=" + record.id + "&action=form12",
        "_blank"
      );
    } catch (error) {
      console.log(" Error in onButtonClick12GTIN: " + error.toString());
    }
  }

  function createPDF12() {
    try {
      // var record = currentRecord.get();
      // console.log(record);
      var suiteletURL = url.resolveScript({
        scriptId: "customscript_bcc_sl_item_label",
        deploymentId: "customdeploy_bcc_sl_item_lab",
        // returnExternalUrl: true
      });

      var urlString = new URL(window.location.href);
      var internalid = urlString.searchParams.get("internalid");

      window.open(
        suiteletURL + "&internalid=" + internalid + "&action=pdf12",
        "_blank"
      );
    } catch (error) {
      console.log(" Error in onButtonClick12GTIN: " + error.toString());
    }
  }

  // ALL THE FUCTIONALITY FOR THE BUTTON GTIN14

  function onButtonClick14GTIN() {
    try {
      var record = currentRecord.get();
      var suiteletURL = url.resolveScript({
        scriptId: "customscript_bcc_sl_item_label",
        deploymentId: "customdeploy_bcc_sl_item_lab",
        // returnExternalUrl: true
      });

      window.open(
        suiteletURL + "&internalid=" + record.id + "&action=form14",
        "_blank"
      );
    } catch (error) {
      console.log(" Error in onButtonClick12GTIN: " + error.toString());
    }
  }

  function createPDF14() {
    try {
      var record = currentRecord.get();
      console.log(record);
      var stockUnit = record.getValue({
        fieldId: "custpage_primary_stock_unit",
      });
      console.log(stockUnit);

      var suiteletURL = url.resolveScript({
        scriptId: "customscript_bcc_sl_item_label",
        deploymentId: "customdeploy_bcc_sl_item_lab",
        // returnExternalUrl: true
      });

      var urlString = new URL(window.location.href);
      var internalid = urlString.searchParams.get("internalid");
     
      window.open(
        suiteletURL + "&internalid=" + internalid + "&action=pdf14&stock=" + stockUnit,
        "_blank"
      );
    } catch (error) {
      console.log(" Error in onButtonClick14GTIN: " + error.toString());
    }
  }

  // function success(results) {
  //   if(results == true) {
  //     // calling Suitelet
  //     var suiteletURL = url.resolveScript({
  //       scriptId: 'customscript_bcc_sl_item_label',
  //       deploymentId: 'customdeploy_bcc_sl_item_label',
  //       // returnExternalUrl: true
  //      });

  //      window.open(suiteletURL);

  //   }
  //   return results;
  // }

  //   function onDownload() {
  //     // var button = document.getElementById("custpage_downloadLabels");
  //     // button.addEventListener("click", function(e){
  //     // // var url = "SuiteScripts/Page To Be Downloaded.txt";
  //     // var filename = "output.txt";
  //     // download(filename);

  //     // });

  //       // var filename = "output.txt";
  //       download();
  // }

  // function download(){
  //   var element = document.createElement("a");
  //   element.setAttribute('href', "https://6922326.app.netsuite.com/core/media/media.nl?id=4562&c=6922326&h=z6sGPCV4vvM2FvXwO2CuIS2Yj0DEU5Xco0e0nxvLiffxtvUo&mv=kyei1sw8&_xt=.txt&fcts=20220114063205&whence=" , "data:text/plain; charset=utf-8," );
  //   element.setAttribute("download" , "abc");
  //   // element.style.display = none;
  //   document.body.appendChild(element);
  //   element.click();
  //   document.body.removeChild(element);
  // }

  return {
    pageInit: pageInit,
    onButtonClick12GTIN: onButtonClick12GTIN,
    onButtonClick14GTIN: onButtonClick14GTIN,
    createPDF12: createPDF12,
    createPDF14: createPDF14,
    //  onDownload: onDownload,
  };
});
