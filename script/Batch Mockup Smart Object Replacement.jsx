
// v.1.3.
// Batch Mockup Smart Object Replacement.jsx
// You'll need to incplude this file to another script file:
// #include "../script/Batch Mockup Smart Object Replacement.jsx" 
// Check the example folders for a real world example.

// Minimal settings
/*
mockups([
  
  {
    mockupPath: '$/mockup.psd',
    smartObjects: [
      { target: '@replace' }, 
    ]
  },
  
]);
*/

// DEFAULT SETTINGS

/*
mockups([
  
  {
    output: {
      // General path info: 
      // - Paths need to be absolute or include the following prefixes: "$" or "."
      // - ...Although, ou can get parent folders by combining them with "../", like so: "../$/mockup.psd", ".././mockup.psd"
      // - Path prefix: "$/"
      //   - Points to the parent folder of the initiating script file. 
      //   - Can be used with all paths.
      // - Path prefix: "./"
      //   - Points to the parent folder of the psd mockup. 
      //   - Can be used with all paths except "mockupPath".
      path: '$/_output', // The output folder is created automatically.
      format: 'jpg',     // 'jpg', 'png', 'tif', 'psd', 'pdf'
      zeroPadding: true  // Set this to false if you don't want to add zero padding to the number suffix of the output images: (009, 010, ...100, 101). The padding is based on the amount of output images.
      folders: false, // Files will be grouped in folders inside the output folder
      // @mockup = mockup psd name
      // $ = incremental numbers
      filename: '@mockup - $', // Can be any static string, but make sure to include $.
    }, 
    mockupPath: '', // Path to the mockup. For example: '../$/example-1/assets/Bus Stop Billboard MockUp/Bus Stop Billboard MockUp.psd'
    hideLayers: [], // Array of strings with unique layer names. Will be hidden before any replacements are made in the mockup.
    showLayers: [], // Array of strings with unique layer names. Will be shown before any replacements are made in the mockup. Smart object "target" layer is always shown...
    // If you have multiple smart objects per mockup and let's say one of them has 2 input images and another has 6 input images, the default behavior is that the smaller array of images is supplemented by using duplicates:
    // SO #1 inputs: ['1.jpg', '2.jpg']
    // SO #2 inputs: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg']
    // Input #1 will end up looking like this: ['1.jpg', '2.jpg', '1.jpg', '2.jpg', '1.jpg', '2.jpg']
    // With noRepeats true, the so content swapping is stopped once the input images run out and the smart object is hidden.
    // This may require you to set a separate background fill behind the smart object in some cases.
    noRepeats: false, 
    smartObjects: [
      {
        // Unique smart object layer name. Sometimes mockups have multiple layers with the same name. Make sure they are unique. I recommend adding a '@' to the front of the layer name.
        target: '', // String
        // Same as with "target", make sure this a unique layer name.
        // "nestedTarget" needs to be inside the "target" smartobject.
        // - This can be used to for example placing screenshots inside a desktop browser window
        // - Sometimes mockup smart objects have transparent whitespace around the graphic. You can set a smaller target inside "target" by using "nestedTarget".
        // - There's an example on the usage in both example script files. In example-1 it's in the mug mockup and in example-2 it's in the billboard mockup.
        nestedTarget: '',  // String.
        // Input example: ['$/_input/photos-1', './_input/photos-2']
        // - Only looks for files from the input path(s)
        // - Ignores nested folders
        // - If you want to use nested folders you need to define each of them separately: ['$/_input/photos-1', '$/_input/photos-1/nested-photos']
        // - Non-image files in the input folder will be ignored
        // - Input files are sorted alphanumerically in ascending order. This is also the output order. 
        // - You can add numbering if you want a specific order.
        input: '', // String or Array. Path to the input files. 
        inputNested: false, // Set to true to dig deep in the input folder(s)
        inputFormats: 'tiff?|gif|jpe?g|bmp|eps|svg|png|ai|psd|pdf', // Separate multiple formats with a vertical pipe. 
        // CSS style alignment values:
        // 'left top' 
        // 'left center' 
        // 'left bottom' 
        // 'right top'
        // 'right center' 
        // 'right bottom'
        // 'center top'
        // 'center center'
        // 'center bottom'
        align: 'center center',
        // Resize values: 
        // false
        // 'fill'  
        // 'fit'   
        // 'xFill' - Fills horizontally (useful for screenshots, for instance)
        // 'yFill  - Fill vertically
        resize: 'fill',
        // Set this to false if you want the resizing to take transparent whitespace in the input images into consideration. Settings this to false works with  align: 'center center'. This could be improved, but the crux of the issue 
        trimTransparency: true, 
      },
      
      // You can set as many smart objects as you dare...
      // { ... },
      
    ]
  },
  
  // You can set as many mockups as you dare...
  // { ... },
  
]);

*/


// CHANGELOG

// v.1.3.
// Tested in Photoshop CC 2019
// - Fixed an issue that prevented you from leaving output settings empty in order to use the defaults

// v.1.2.
// Tested in Photoshop CC 2019
// - Fixed an issue with zero padding

// v.1.1.
// Tested in Photoshop CC 2019
// - Fixed an issue where an array of input files would silently fail to output every single file

// v.1.0.
// Tested in Photoshop CC 2019

var includePath = '';
if ( $.includePath ) includePath = File.decode($.includePath);
var docPath = '';

function mockups( mockups ) {
  soReplaceBatch( mockups );
}

function soReplaceBatch( mockups ) {
  
  for ( var i=0; i < mockups.length; i++ ) {
    var mockup = mockups[i];
    var mockupPSD = absolutelyRelativePath( mockup.mockupPath );
    if ( mockupPSD.file ) {
      
      app.open( mockupPSD.file );
      
      if ( mockup.showLayers ) {
        each( mockup.showLayers, function( layerName ) {
          var layer = getLayer( layerName );
          layer.visible = true;
        });
      }
      
      if ( mockup.hideLayers ) {
        each( mockup.hideLayers, function( layerName ) {
          var layer = getLayer( layerName );
          layer.visible = false;
        });
      }
      
      soReplace({
        output: mockup.output,
        items: mockup.smartObjects,
        noRepeats: mockup.noRepeats,
      });
      
      app.activeDocument.close( SaveOptions.DONOTSAVECHANGES );
      
    }
  }
  alert('Batch process done!');
}

function soReplace( rawData ) {
  
  app.activeDocument.suspendHistory("soReplace", "init(rawData)");
  
  function init( rawData ) {
    
    var rulerUnits = app.preferences.rulerUnits;
    app.preferences.rulerUnits = Units.PIXELS;
    
    var data = replaceLoopOptionsFiller( rawData );
    
    // Preparing files
    for ( var i=0; i < data.items.length; i++ ) {
      var item = data.items[i];
      item.files = prepFiles( item );
    }
    
    // This makes sure all file arrays are the same length
    data = evenOutFileArrays( data );
    replaceLoop( data );
    
    app.preferences.rulerUnits = rulerUnits;
    
  }
  
}

function replaceLoop( data ) {
  
  for ( var fileIndex=0; fileIndex < data.maxLoop; fileIndex++ ) {
    
    for ( var itemIndex=0; itemIndex < data.items.length; itemIndex++ ) {
      var item = data.items[ itemIndex ];
      if ( item.target ) {

        var targetConfirmed = false;
        try { 
          app.activeDocument.activeLayer = item.target; 
          targetConfirmed = true;
        } catch(e) {}
        
        if ( targetConfirmed ) {
          
          if ( fileIndex == 0 ) convertSoToEmbedded(); // Just in case the target layer is a linked SO...
          var sourceFilePath = item.files[ fileIndex ];
          
          if ( sourceFilePath !== null ) {
            
            app.activeDocument.activeLayer.visible = true;
            
            replaceSoContents( item, sourceFilePath ); // The old switcheroo
            
            // if ( item.targetVisibility === false || item.targetVisibility === true ) {
            //   app.activeDocument.activeLayer.visible = item.targetVisibility;
            // }
            
          }
          else {
            app.activeDocument.activeLayer.visible = false;
          }
          
        }
        
      }
    }
    
    var outputFileName = data.output.path + "/" + parseFilename( data, fileIndex );
    app.activeDocument.saveAs( new File( outputFileName ), saveOpts()[ data.output.format ](), true, Extension.LOWERCASE);
    
    if ( sourceFilePath === null ) app.activeDocument.activeLayer.visible = item.targetVisibility;
    
  }
  
}

function parseFilename( data, fileIndex) {
  
  var fileNumber = fileIndex+1;
  if ( data.output.zeroPadding ) fileNumber = zeroPadding( fileNumber, data.maxLoop.toString().length );
  
  var filename = data.output.filename.replace('@mockup', data.doc.name).replace('$', fileNumber);
  
  return filename + "." + data.output.format;
  
}

function prepFiles( item ) {
  if ( typeof item.input === 'string' ) item.input = [ item.input ];
  
  var inputFiles = [];
  for ( var i=0; i < item.input.length; i++ ) {
    var inputFolder = new Folder( item.input[i] );
    var files = getFiles( inputFolder, item );
    if ( files ) inputFiles = inputFiles.concat( files );
  };
  
  return inputFiles.sort(function (a, b) {
    return app.compareWithNumbers(a.name, b.name)
  });
  
}

function getFiles(folder, item) {

  var filteredFiles = [];
  var files = folder.getFiles();
  
  for ( var i = 0; i < files.length; i++ ) {
    
    var file = files[i];
    var regex = ".+\.(?:"+ (item.inputFormats ? item.inputFormats : 'tiff?|gif|jpe?g|bmp|eps|svg|png|ai|psd|pdf') +")$";
    var matchThis = new RegExp(regex, "i");
    var fileFilter = file.name.match( matchThis );
    
    var isFile = (file instanceof File && fileFilter);
    var isFolder = (file instanceof Folder);
    
    if ( isFile ) {
      filteredFiles.push( file );
    }
    else if ( isFolder && item.inputNested ) {
      var folder = file;
      filteredFiles = filteredFiles.concat( this.getFiles( folder, item ) );
    }
    
  }
  
  return filteredFiles.length < 1 ? null : filteredFiles;
  
}


function evenOutFileArrays( data ) {
  
  data.maxLoop = findLargestArrayLength( data.items );
  
  for ( var a=0; a < data.items.length; a++ ) {
    var item = data.items[a];
    var itemLength = item.length;
    var fillerIndex = 0;
    for ( var b=0; b < data.maxLoop; b++ ) {

      if ( item.files[b] == undefined ) {
        item.files[b] = data.noRepeats ? null : item.files[ fillerIndex ];
        fillerIndex++;
        if ( fillerIndex > (itemLength-1) ) fillerIndex = 0;
      }
      
    }
  }
  
  return data;
  
}

function findLargestArrayLength( items ) {
  
	var max = 0;
  for ( var i=0; i < items.length; i++ ) {
    var filesLength = items[i].files.length;
    if ( filesLength > max ) max = filesLength;
  }
  return max;
  
}

function replaceLoopOptionsFiller( rawData ) {
  
  // General fallbacks...
  rawData.output = rawData.output || {};
  var data = {
    output: {
      path       : rawData.output.path || '$/output',
      format     : rawData.output.format || 'jpg',
      folders    : rawData.output.folders || false,
      filename   : rawData.output.filename || '@mockup - $',
      zeroPadding: rawData.output.zeroPadding === undefined ? true : rawData.output.zeroPadding,
    }
  };
  
  if ( rawData.noRepeats === true ) data.noRepeats = true;
  
  // Document
  var doc = app.activeDocument;
  data.doc = {
    name: doc.name.replace(/\.[^\.]+$/, ''),
    path: File.decode( doc.path ) + '/'
  };
  
  docPath = data.doc.path;
  
  var items = [];
  for ( var i=0; i < rawData.items.length; i++ ) {
    var rawItem = rawData.items[i];
    var itemObj = {};
    if ( rawItem.target ) itemObj.target = rawItem.target;
    if ( rawItem.align  ) itemObj.align  = rawItem.align;
    if ( rawItem.nestedTarget ) itemObj.nestedTarget = rawItem.nestedTarget;
    if ( rawItem.trimTransparency === false ) itemObj.trimTransparency = false;
    if ( rawItem.inputNested ) itemObj.inputNested = rawItem.inputNested;
    itemObj.input  = rawItem.input || '$/input';
    itemObj.inputFormats = rawItem.inputFormats;
    itemObj.resize = (rawItem.resize || rawItem.resize === false) ? rawItem.resize : 'fill';
    items.push( itemObj );
  }
  
  data.items = items || [];
  
  // ITEM specific fallbacks
  for ( var i=0; i < data.items.length; i++ ) {
    
    var item = data.items[i];
    
    // Target layer
    if ( item.target  ) {
      // var targetName = item.target;
      item.target = getLayer( item.target );
      item.targetVisibility = item.target.visible;
      // if ( !item.target ) alert( 'Target layer missing: \n ' + targetName );
    }
    
    // Input folder path
    if ( typeof item.input === 'string' ) item.input = [ item.input ];
    for ( var inputIndex=0; inputIndex < item.input.length; inputIndex++ ) {
      item.input[ inputIndex ] = absolutelyRelativePath( item.input[inputIndex] ).decoded;
    }
    
  }
  
  // Output folder path
  data.output.path = absolutelyRelativePath( data.output.path ).decoded;
  newFolder( data.output.path );
  
  if ( data.output.folders ) {
    data.output.path = absolutelyRelativePath( data.output.path + '/' + data.doc.name ).decoded;
    newFolder( data.output.path );
  }
  
  // Output file format
  data.output.format = data.output.format || 'jpg';
  data.output.format = data.output.format.toLowerCase();
  if ( data.output.format === 'jpeg' ) data.output.format = 'jpg';
  else if ( data.output.format === 'tiff' ) data.output.format = 'tif';
    
  return data;
  
}

function saveOpts() {
  return {
    psd: function() {
      
      var psd_saveOpts = new PhotoshopSaveOptions();
      
      psd_saveOpts.layers            = true;
      psd_saveOpts.embedColorProfile = true;
      psd_saveOpts.annotations       = true;
      psd_saveOpts.alphaChannels     = true;
      
      return psd_saveOpts;
      
    },
    pdf: function() {
      
      var presetName = '[High Quality Print]';
      var pdf_SaveOpts = new PDFSaveOptions();
      // pdf_SaveOpts.pDFPreset = 'presetName';
      return pdf_SaveOpts;
      
    },
    jpg: function() {
      
      var jpg_SaveOpts = new JPEGSaveOptions();
      jpg_SaveOpts.matte   = MatteType.WHITE;
      jpg_SaveOpts.quality = 12;
      jpg_SaveOpts.formatOptions.STANDARDBASELINE;
      return jpg_SaveOpts;
      
    },
    png: function() {
      
      var png_SaveOpts = new PNGSaveOptions();
      png_SaveOpts.compression = 9;
      png_SaveOpts.interlaced = false;
      return png_SaveOpts;
      
    },
    tif: function() {
      
      var tiff_SaveOpts = new TiffSaveOptions();
      tiff_SaveOpts.alphaChannels      = true;
      tiff_SaveOpts.annotations        = true;
      tiff_SaveOpts.imageCompression   = TIFFEncoding.JPEG;
      tiff_SaveOpts.interleaveChannels = true;
      tiff_SaveOpts.jpegQuality        = 12;
      tiff_SaveOpts.layers             = true;
      tiff_SaveOpts.layerCompression   = LayerCompression.ZIP;
      tiff_SaveOpts.transparency       = true;
      return tiff_SaveOpts;
      
    }
  };
}

function newFolder( path ) {
  
  var folder = new Folder( path );
  if ( !folder.exists ) folder.create();
  
}

function convertSoToEmbedded() {
  try { executeAction( stringIDToTypeID( "placedLayerConvertToEmbedded" ), undefined, DialogModes.NO ); } catch (e) {}
}

function replaceSoContents( item, sourcepath ) {
  
  // EDIT SO CONTENTS
  try { 
    executeAction( stringIDToTypeID( "placedLayerEditContents" ), new ActionDescriptor(), DialogModes.NO ); 
    var editingSO = true; 
  } 
  catch (e) { var editingSO = false; }
  
  // Inception - Time moves like thrice as slow here
  if ( editingSO && item.nestedTarget ) {
    editingSO = false;
    var nestedSO = getLayer( item.nestedTarget );
    if ( nestedSO ) {
      try { 
        executeAction( stringIDToTypeID( "placedLayerEditContents" ), new ActionDescriptor(), DialogModes.NO ); 
        editingSO = true;
      } catch (e) {}
    }
  }
  
  if ( editingSO ) {
    
    var doc = app.activeDocument;
    
    // FLATTEN
    executeAction( stringIDToTypeID( "flattenImage" ), undefined, DialogModes.NO );
        
    // PLACE NEW IMAGE
    var file = new File( sourcepath );
    if ( file.exists ) {
      try {
        
        var idPlc = charIDToTypeID( "Plc " );
          var desc394 = new ActionDescriptor();
          var idIdnt = charIDToTypeID( "Idnt" );
          desc394.putInteger( idIdnt, 9999 );
          var idnull = charIDToTypeID( "null" );
          desc394.putPath( idnull, file );
          var idFTcs = charIDToTypeID( "FTcs" );
          var idQCSt = charIDToTypeID( "QCSt" );
          var idQcsa = charIDToTypeID( "Qcsa" );
          desc394.putEnumerated( idFTcs, idQCSt, idQcsa );
          var idOfst = charIDToTypeID( "Ofst" );
            var desc395 = new ActionDescriptor();
            var idHrzn = charIDToTypeID( "Hrzn" );
            var idPxl = charIDToTypeID( "#Pxl" );
            desc395.putUnitDouble( idHrzn, idPxl, 0.000000 );
            var idVrtc = charIDToTypeID( "Vrtc" );
            var idPxl = charIDToTypeID( "#Pxl" );
            desc395.putUnitDouble( idVrtc, idPxl, 0.000000 );
          var idOfst = charIDToTypeID( "Ofst" );
          desc394.putObject( idOfst, idOfst, desc395 );
          var idAntA = charIDToTypeID( "AntA" );
          desc394.putBoolean( idAntA, true );
          var idLnkd = charIDToTypeID( "Lnkd" );
          desc394.putBoolean( idLnkd, true );
        executeAction( idPlc, desc394, DialogModes.NO );
        
        var bounds  = app.activeDocument.activeLayer.boundsNoEffects;        
        var imageSize = {
          width: bounds[2].value - bounds[0].value,
          height: bounds[3].value - bounds[1].value
        };
        
        // When trimTransparency is set to false some trickery is needed:
        // - Resize: we open SO contents to get the true document witdh, because transparency is not included in layer.bounds
        // - Align: for same reason we also add in a color fill, so that bounds are fetched properly
        // The tricky part is that to make sure we can save the smart object back, be actually need to make a new one 
        // with the contents of the input image and the newly made color fill and then duplicate that to the parent SO.
        // The color fill is removed after aligning.
        if ( item.trimTransparency === false ) {
          
          var returnLayer = app.activeDocument.activeLayer;
          
          executeAction( stringIDToTypeID( "placedLayerEditContents" ), new ActionDescriptor(), DialogModes.NO ); 
          
          var soDoc = app.activeDocument;
          imageSize = {
            width: soDoc.width.value,
            height: soDoc.width.value,
          };
          
          if ( item.align ) {
            var soFillLayer = soDoc.artLayers.add();
            soFillLayer.name = '@soFillLayer (Ksivzn0Tqm)';
            
            // Fill document with color
            var idFl = charIDToTypeID( "Fl  " );
            var desc486 = new ActionDescriptor();
            var idUsng = charIDToTypeID( "Usng" );
            var idFlCn = charIDToTypeID( "FlCn" );
            var idFrgC = charIDToTypeID( "FrgC" );
            desc486.putEnumerated( idUsng, idFlCn, idFrgC );
            executeAction( idFl, desc486, DialogModes.NO );
            
            // Turn all layers into a new smart object and push it to the parent smart object
            selectAllLayers(false, true);
            executeAction( stringIDToTypeID( "newPlacedLayer" ), undefined, DialogModes.NO );
            soDoc.activeLayer.name = soDoc.name;
            soDoc.activeLayer.duplicate( returnLayer, ElementPlacement.PLACEBEFORE );
            
          }
          
          soDoc.close( SaveOptions.DONOTSAVECHANGES );
          if ( item.align ) returnLayer.remove();
          
        }
        
        if ( item.resize ) {
          var newSize = calculateNewSize(
            [ imageSize.width, imageSize.height ],
            [ doc.width.value, doc.height.value ]
          ).percentage;
          
          switch ( item.resize ) {
            case "fit":
              newSize = newSize.fit; // Makes sure image fits inside the document
              break;
              
            case "x":
            case "fillX":
            case "fitX":
            case "xFill":
            case "xFit":
              newSize = newSize.x; // Makes sure image fills document horizontally
              break;
            
            case "y":
            case "fillY":
            case "fitY":
            case "yFill":
            case "yFit":
              newSize = newSize.y; // Makes sure image fills document vertically
              break;

            default:
              newSize = newSize.fill; // Makes sure every part of the document is filled by the image
              break;
          }
          doc.activeLayer.resize( newSize, newSize, AnchorPosition.MIDDLECENTER );
        }
        
        if ( item.align ) align( doc.activeLayer, [ 0, 0, doc.width.value, doc.height.value ], item.align );
        
        if ( item.align && item.trimTransparency === false ) {
          executeAction( stringIDToTypeID( "placedLayerEditContents" ), new ActionDescriptor(), DialogModes.NO ); 
          var soFillLayer = getLayer('@soFillLayer (Ksivzn0Tqm)')
          if ( soFillLayer ) soFillLayer.remove();
          app.activeDocument.close( SaveOptions.SAVECHANGES );
        }
        
        // HIDE BACKGROUND
        if ( doc.layers.length > 1 ) doc.backgroundLayer.visible = false;
        
      } catch (e) {}
    }
    
    if ( item.nestedTarget ) doc.close( SaveOptions.SAVECHANGES );
    
    app.activeDocument.close( SaveOptions.SAVECHANGES );
    
  }
  
}

function selectAllLayers( ignoreBackground, detachBG ) {
  if ( !ignoreBackground && detachBG ) {
    try { 
      activedocument.backgroundLayer; 
      var bgVisible = doc.backgroundLayer.visible;
      if ( bgVisible ) {
        // Make into a normal layer
        // =======================================================
        var idsetd = charIDToTypeID( "setd" );
        var desc304 = new ActionDescriptor();
        var idnull = charIDToTypeID( "null" );
            var ref46 = new ActionReference();
            var idLyr = charIDToTypeID( "Lyr " );
            var idBckg = charIDToTypeID( "Bckg" );
            ref46.putProperty( idLyr, idBckg );
        desc304.putReference( idnull, ref46 );
        var idT = charIDToTypeID( "T   " );
            var desc305 = new ActionDescriptor();
            var idOpct = charIDToTypeID( "Opct" );
            var idPrc = charIDToTypeID( "#Prc" );
            desc305.putUnitDouble( idOpct, idPrc, 100.000000 );
            var idMd = charIDToTypeID( "Md  " );
            var idBlnM = charIDToTypeID( "BlnM" );
            var idNrml = charIDToTypeID( "Nrml" );
            desc305.putEnumerated( idMd, idBlnM, idNrml );
        var idLyr = charIDToTypeID( "Lyr " );
        desc304.putObject( idT, idLyr, desc305 );
        var idLyrI = charIDToTypeID( "LyrI" );
        desc304.putInteger( idLyrI, 49 );
        executeAction( idsetd, desc304, DialogModes.NO );
      }
    } catch(e) {}
  }
  // Select all layers (doesn't include Background)
  try {
    var desc = new ActionDescriptor();
    var ref = new ActionReference();
    ref.putEnumerated( charIDToTypeID('Lyr '), charIDToTypeID('Ordn'), charIDToTypeID('Trgt') );
    desc.putReference( charIDToTypeID('null'), ref );
    executeAction( stringIDToTypeID('selectAllLayers'), desc, DialogModes.NO );
  } catch(e) {}
  // if ( !ignoreBackground ) {
  //   // Add Background Layer to the selection (if it exists)
  //   try {
  //     activeDocument.backgroundLayer;
  //     var bgID = activeDocument.backgroundLayer.id;
  //     var ref = new ActionReference();
  //     var desc = new ActionDescriptor();
  //     ref.putIdentifier(charIDToTypeID('Lyr '), bgID);
  //     desc.putReference(charIDToTypeID('null'), ref);
  //     desc.putEnumerated( stringIDToTypeID('selectionModifier'), stringIDToTypeID('selectionModifierType'), stringIDToTypeID('addToSelection') );
  //     desc.putBoolean(charIDToTypeID('MkVs'), false);
  //     executeAction(charIDToTypeID('slct'), desc, DialogModes.NO);
  //   } catch(e) {}
  // }
}

function calculateNewSize( inputSize, targetSize ) {
  function mathMax( array ) { return array[0] > array[1] ? array[0] : array[1]; }
  function mathMin( array ) { return array[0] < array[1] ? array[0] : array[1]; }
  var sizeArray  = [ targetSize[0] / inputSize[0], targetSize[1] / inputSize[1] ];
  var ratioFit   = mathMin( sizeArray );
  var ratioFill  = mathMax( sizeArray );
  var fillWidth  = inputSize[ sizeArray[0] > sizeArray[1] ? 1 : 0 ]*ratioFill;
  var fillHeight = inputSize[ sizeArray[0] < sizeArray[1] ? 1 : 0 ]*ratioFit;
  return {
    pixels: {
      fit:  { width: inputSize[0]*ratioFit,  height: inputSize[1]*ratioFit  },
      fill: { width: inputSize[0]*ratioFill, height: inputSize[1]*ratioFill },
      x:    { width: targetSize[0],          height: fillWidth 							},
      y:    { width: fillHeight, 						 height: targetSize[1] 				  },
    },
    percentage: {
      fit:  (100 / inputSize[0]) * (inputSize[0]*ratioFit),
      fill: (100 / inputSize[0]) * (inputSize[0]*ratioFill),
      x:    (100 / inputSize[0]) * (inputSize[0]*sizeArray[0]),
      y:    (100 / inputSize[1]) * (inputSize[1]*sizeArray[1]),
    }
  };
}


function zeroPadding(number, padding) {
  number = number.toString();
  while (number.length < padding) number = '0' + number;
  return number;
}

/*
left top
left center
left bottom
right top
right center
right bottom
center top
center center
center bottom
*/
function align( imageLayer, targetBounds, alignment ) {
  
  var imageBounds = imageLayer.boundsNoEffects;
  
  var image = {
    offset: {
      top: imageBounds[1].value,
      right: imageBounds[2].value,
      bottom: imageBounds[3].value,
      left: imageBounds[0].value,
    },
  };
  var target = {
    offset: {
      top: targetBounds[1].value || targetBounds[1],
      right: targetBounds[2].value || targetBounds[2],
      bottom: targetBounds[3].value || targetBounds[3],
      left: targetBounds[0].value || targetBounds[0],
    },
  };
  
  image.width  = image.offset.right  - image.offset.left;
  image.height = image.offset.bottom - image.offset.top;
  
  target.width   = target.offset.right  - target.offset.left;
  target.height  = target.offset.bottom - target.offset.top;
  var translateX = 0;
  var translateY = 0;
  var splitAlignment = alignment ? alignment.split(' ') : ['center', 'center'];
  
  // Assumes both x and y are always given
  each( splitAlignment, function( alignment, index ) {
    
    var x = (index === 0);
    var y = (index === 1);
    var alignmentString = alignment.replace(/^\s+/,'').replace(/\s+$/,'');
    if ( x ) {
      translateX = calculateAlignmentX( image, target, alignmentString );
    }
    else if ( y ) {
      translateY = calculateAlignmentY( image, target, alignmentString );
    }
    
  });
  
  imageLayer.translate( translateX, translateY );
  
}

function calculateAlignmentX( image, target, align ) {
  // HORIZONTAL
  var originX = target.offset.left - image.offset.left;
  switch( align ) {
    case "left":
      return originX;
      break;
    case "center":
      return originX - ( image.width/2  ) + ( target.width/2  );
      break;
    case "right":
      return originX + target.width - image.width;
      break;
  }
}

function calculateAlignmentY( image, target, align ) {
  // VERTICAL
  var originY = target.offset.top  - image.offset.top;
  switch( align ) {
    case "top":
      return originY;
      break;
    case "center":
      return originY - ( image.height/2 ) + ( target.height/2 );
      break;
    case "bottom":
      return originY + target.height - image.height;
      break;
  }
}

// Find & Select a layer anywhere in the active document;
function getLayer( layerName ) {
  try {
    
    var select = charIDToTypeID( "slct" );
    var actionDescriptor = new ActionDescriptor();
    var idnull = charIDToTypeID( "null" );
    var actionReference = new ActionReference();
    var layer = charIDToTypeID( "Lyr " );
    actionReference.putName( layer, layerName );
    actionDescriptor.putReference( idnull, actionReference );
    var makeVisibleID = charIDToTypeID( "MkVs" );
    actionDescriptor.putBoolean( makeVisibleID, false );
    var layerId = charIDToTypeID( "LyrI" );
    var actionList = new ActionList();
    actionList.putInteger( 1 );
    actionDescriptor.putList( layerId, actionList );
    executeAction( select, actionDescriptor, DialogModes.NO );
    
    return app.activeDocument.activeLayer;
    
  } catch(e) {
    return false;
  }
}

function scriptFolder() {
  return File.decode( new File($.includePath) ) + '/';
}

function each( array, callback ) {
  var imAboutTo = false;
  for ( var i=0; i < array.length; i++ ) {
    imAboutTo = callback( array[i], i );
    if ( imAboutTo ) break;
  }
}

function absolutelyRelativePath( string ) {
  
  string = string.replace(/\/$/, '') // Removes trailing forward slash...
  
  var newString = '';
  var familyTrees = [
    { type: 'script',  regex: string.match( /^(\.\.\/)+(\$\/)/ ) },
    { type: 'doc',     regex: string.match( /^(\.\.\/)+(\.\/)/ ) },
    { type: 'regular', regex: string.match( /^(\.\.\/)+/ )       },
  ];
  
  var familyTree;
  each( familyTrees, function( tree ) {
    if ( tree.regex ) {
      familyTree = tree;
      return true;
    }
  });
  
  if ( familyTree ) {
    
    familyTree.string = familyTree.regex[0]; // "../../../$/"
    familyTree.array  = familyTree.regex[0].match(/\.\.\//g); // ["../", "../", "../"]
    
    // Traverse upwards
    var pathPrefix = new File( familyTree.type === 'doc' ? docPath : includePath );
    each(familyTree.array, function() { pathPrefix = pathPrefix.parent; });
    
    var removeString = familyTree.string; // "../../../$/"
    newString = string.replace( removeString, pathPrefix.fullName + '/' );
    
  }
  else {
    
    newString = string.replace(/^\$\//, includePath + '/');
    if ( docPath ) newString = newString.replace(/^\.\//, docPath + '/');
    
  }
  
  return {
    file: File( newString ),
    decoded: File.decode( newString )
  };
  
}