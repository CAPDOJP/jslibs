/*
*--------------------------------------------------------------------
* jQuery-Plugin "yearcalc -config.js-"
* Version: 3.0
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
		datetable:null,
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
						case 'DATE':
							$('select#date').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
					}
				}
			});
			/* initialize valiable */
			vars.datetable=$('.kintoneplugin-table').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			var row=null;
			var dates=[];
			if (Object.keys(config).length!==0)
			{
				dates=JSON.parse(config['dates']);
				for (var i=0;i<dates.length;i++)
				{
					if (i>0) vars.datetable.addrow();
					row=vars.datetable.rows.last();
					$('select#date',row).val(dates[i]);
				}
			}
		},function(error){});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var error=false;
		var row=null;
		var config=[];
		var dates=[];
		/* check values */
		for (var i=0;i<vars.datetable.rows.length;i++)
		{
			row=vars.datetable.rows.eq(i);
			if ($('select#date',row).val().length!=0) dates.push($('select#date',row).val());
		}
		/* setup config */
		config['dates']=JSON.stringify(dates);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);