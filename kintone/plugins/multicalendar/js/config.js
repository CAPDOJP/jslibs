/*
*--------------------------------------------------------------------
* jQuery-Plugin "multicalendar -config.js-"
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
		fieldtable:null,
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
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'SINGLE_LINE_TEXT':
							$('select#field').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					}
				}
			});
			vars.fieldtable=$('.fields').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			var add=false;
			var row=null;
			var fields=[];
			if (Object.keys(config).length!==0)
			{
				fields=config['field'].split(',');
	        	$('input#span').val(config['span']);
				$.each(fields,function(index){
					if (add) vars.fieldtable.addrow();
					else add=true;
					row=vars.fieldtable.rows.last();
					$('select#field',row).val(fields[index]);
				});
			}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var fields=[];
		/* check values */
		for (var i=0;i<vars.fieldtable.rows.length;i++)
		{
			row=vars.fieldtable.rows.eq(i);
			if ($('select#field',row).val().length!=0) fields.push($('select#field',row).val());
		}
		if (fields.length==0)
		{
			swal('Error!','日付データ格納フィールドを指定して下さい。','error');
			return;
		}
		if ($('input#span').val()=='') $('input#span').val('1');
		if (!$.isNumeric($('input#span').val()))
		{
			swal('Error!','表示期間は数値を入力して下さい。','error');
			return;
		}
		/* setup config */
        config['span']=$('input#span').val();
		config['field']=fields.join(',');
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);