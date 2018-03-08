/*
*--------------------------------------------------------------------
* jQuery-Plugin "postalbarcode -config.js-"
* Version: 3.0
* Copyright (c) 2018 TIS
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
			vars.fieldinfos=resp.properties;
			/* initialize valiable */
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'FILE':
							$('select#barcode').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'SINGLE_LINE_TEXT':
							$('select#zip').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#address').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			if (Object.keys(config).length!==0)
			{
				$('select#zip').val(config['zip']);
				$('select#address').val(config['address']);
				$('select#barcode').val(config['barcode']);
				if (config['denydownload']=='1') $('input#denydownload').prop('checked',true);
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
		if ($('select#zip').val()=='')
		{
			swal('Error!','郵便番号を指定して下さい。','error');
			return;
		}
		if ($('select#address').val()=='')
		{
			swal('Error!','住所を指定して下さい。','error');
			return;
		}
		if ($('select#barcode').val()=='')
		{
			swal('Error!','バーコード画像を指定して下さい。','error');
			return;
		}
		/* setup config */
		config['zip']=$('select#zip').val();
		config['address']=$('select#address').val();
		config['barcode']=$('select#barcode').val();
		config['denydownload']=($('input#denydownload').prop('checked'))?'1':'0';
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);