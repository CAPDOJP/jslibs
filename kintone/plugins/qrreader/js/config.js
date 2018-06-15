/*
*--------------------------------------------------------------------
* jQuery-Plugin "qrreader -config.js-"
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
			var mappings=[];
			/* append lookup mappings fields */
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			$.each(vars.fieldinfos,function(key,values){
				if (values.lookup)
					$.each(values.lookup.fieldMappings,function(index,values){
						mappings.push(values.field);
					});
			});
			$.each(sorted,function(index){
				if (sorted[index] in vars.fieldinfos)
				{
					var fieldinfo=vars.fieldinfos[sorted[index]];
					/* check field type */
					switch (fieldinfo.type)
					{
						case 'LINK':
						case 'SINGLE_LINE_TEXT':
							/* exclude lookup */
							if (!fieldinfo.lookup)
								if ($.inArray(fieldinfo.code,mappings)<0) $('select#field').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					}
				}
			});
			/* initialize valiable */
			vars.fieldtable=$('.fields').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			var add=false;
			var fields=[];
			if (Object.keys(config).length!==0)
			{
				fields=JSON.parse(config['fields']);
				for (var i=0;i<fields.length;i++)
				{
					if (add) vars.fieldtable.addrow();
					else add=true;
					$('select#field',vars.fieldtable.rows.last()).val(fields[i].code);
				}
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
			if ($('select#field',row).val().length==0) continue;
			fields.push({
				code:$('select#field',row).val(),
				tablecode:vars.fieldinfos[$('select#field',row).val()].tablecode
			});
		}
		if (fields.length==0)
		{
			swal('Error!','読み取り結果表示フィールドは1つ以上指定して下さい。','error');
			return;
		}
		/* setup config */
		config['fields']=JSON.stringify(fields);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);