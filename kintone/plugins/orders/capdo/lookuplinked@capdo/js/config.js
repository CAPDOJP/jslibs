/*
*--------------------------------------------------------------------
* jQuery-Plugin "lookuplinked -config.js-"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		fieldinfos:{}
	};
	var functions={
		fieldsort:function(layout){
			var codes=[];
			$.each(layout,function(index,values){
				switch (values.type)
				{
					case 'ROW':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
					case 'GROUP':
						$.merge(codes,functions.fieldsort(values.layout));
						break;
					case 'SUBTABLE':
						$.each(values.fields,function(index,values){
							/* exclude spacer */
							if (!values.elementId) codes.push(values.code);
						});
						break;
				}
			});
			return codes;
		}
	};
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/app/form/layout',true),'GET',{app:kintone.app.getId()},function(resp){
		var sorted=functions.fieldsort(resp.layout);
		/* get fieldinfo */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			var config=kintone.plugin.app.getConfig(PLUGIN_ID);
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			/* initialize valiable */
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'NUMBER':
							if (fieldinfo.lookup)
							{
								if (fieldinfo.tablecode.length==0) $('select#copyfrom').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								else $('select#copyto').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
							break;
						case 'SINGLE_LINE_TEXT':
							if (fieldinfo.lookup)
							{
								if (fieldinfo.tablecode.length==0) $('select#copyfrom').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								else $('select#copyto').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
					}
				}
			});
			if (Object.keys(config).length!==0)
			{
				$('input#license').val(config['license']);
				$('select#copyfrom').val(config['copyfrom']);
				$('select#copyto').val(config['copyto']);
			}
		});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var config=[];
		var tablecodes={};
		/* check values */
		if ($('select#copyfrom').val()=='')
		{
			swal('Error!','コピー元を指定して下さい。','error');
			return;
		}
		if ($('select#copyto').val()=='')
		{
			swal('Error!','コピー先を指定して下さい。','error');
			return;
		}
		/* setup config */
		config['license']=$('input#license').val();
		config['copyfrom']=$('select#copyfrom').val();
		config['copyto']=$('select#copyto').val();
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);