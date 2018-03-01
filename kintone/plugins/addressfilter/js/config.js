/*
*--------------------------------------------------------------------
* jQuery-Plugin "addressfilter -config.js-"
* Version: 1.0
* Copyright (c) 2017 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	var vars={
		settingtable:null,
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
						case 'NUMBER':
							$('select#prefecture').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#city').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#street').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							break;
						case 'SINGLE_LINE_TEXT':
							$('select#prefecturename').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#cityname').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#streetname').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#address').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							$('select#zip').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
					}
				}
			});
			/* initialize valiable */
			vars.settingtable=$('.settings').adjustabletable({
				add:'img.add',
				del:'img.del'
			});
			var add=false;
			var row=null;
			var settings=[];
			if (Object.keys(config).length!==0)
			{
				settings=JSON.parse(config['settings']);
				for (var i=0;i<settings.length;i++)
				{
					if (add) vars.settingtable.addrow();
					else add=true;
					row=vars.settingtable.rows.last();
					$('select#prefecture',row).val(settings[i].prefecture);
					$('select#prefecturename',row).val(settings[i].prefecturename);
					$('select#city',row).val(settings[i].city);
					$('select#cityname',row).val(settings[i].cityname);
					$('select#street',row).val(settings[i].street);
					$('select#streetname',row).val(settings[i].streetname);
					$('select#address',row).val(settings[i].address);
					$('select#zip',row).val(settings[i].zip);
				}
			}
		});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
		var row=null;
		var config=[];
		var settings=[];
		var tablecodes={};
		for (var i=0;i<vars.settingtable.rows.length;i++)
		{
			row=vars.settingtable.rows.eq(i);
			/* check values */
			if ($('select#prefecture',row).val()=='')
			{
				swal('Error!','都道府県コードを指定して下さい。','error');
				return;
			}
			if ($('select#city',row).val()=='')
			{
				swal('Error!','市区町村コードを指定して下さい。','error');
				return;
			}
			if ($('select#street',row).val()=='')
			{
				swal('Error!','町名コードを指定して下さい。','error');
				return;
			}
			tablecodes['prefecture']=($('select#prefecture',row).val().length!=0)?vars.fieldinfos[$('select#prefecture',row).val()].tablecode:'';
			tablecodes['prefecturename']=($('select#prefecturename',row).val().length!=0)?vars.fieldinfos[$('select#prefecturename',row).val()].tablecode:'';
			tablecodes['city']=($('select#city',row).val().length!=0)?vars.fieldinfos[$('select#city',row).val()].tablecode:'';
			tablecodes['cityname']=($('select#cityname',row).val().length!=0)?vars.fieldinfos[$('select#cityname',row).val()].tablecode:'';
			tablecodes['street']=($('select#street',row).val().length!=0)?vars.fieldinfos[$('select#street',row).val()].tablecode:'';
			tablecodes['streetname']=($('select#streetname',row).val().length!=0)?vars.fieldinfos[$('select#streetname',row).val()].tablecode:'';
			tablecodes['address']=($('select#address',row).val().length!=0)?vars.fieldinfos[$('select#address',row).val()].tablecode:'';
			tablecodes['zip']=($('select#zip',row).val().length!=0)?vars.fieldinfos[$('select#zip',row).val()].tablecode:'';
			if (tablecodes['prefecture']!=tablecodes['city'])
			{
				swal('Error!','都道府県コードと市区町村コードの指定は同一テーブルにして下さい。','error');
				return;
			}
			if (tablecodes['prefecture']!=tablecodes['street'])
			{
				swal('Error!','都道府県コードと町名コードの指定は同一テーブルにして下さい。','error');
				return;
			}
			if ($('select#prefecturename',row).val().length!=0)
				if (tablecodes['prefecture']!=tablecodes['prefecturename'])
				{
					swal('Error!','都道府県コードと都道府県名の指定は同一テーブルにして下さい。','error');
					return;
				}
			if ($('select#cityname',row).val().length!=0)
				if (tablecodes['prefecture']!=tablecodes['cityname'])
				{
					swal('Error!','都道府県コードと市区町村名の指定は同一テーブルにして下さい。','error');
					return;
				}
			if ($('select#streetname',row).val().length!=0)
				if (tablecodes['prefecture']!=tablecodes['streetname'])
				{
					swal('Error!','都道府県コードと町名の指定は同一テーブルにして下さい。','error');
					return;
				}
			if ($('select#address',row).val().length!=0)
				if (tablecodes['prefecture']!=tablecodes['address'])
				{
					swal('Error!','都道府県コードと連結住所の指定は同一テーブルにして下さい。','error');
					return;
				}
			if ($('select#zip',row).val().length!=0)
				if (tablecodes['prefecture']!=tablecodes['zip'])
				{
					swal('Error!','都道府県コードと郵便番号の指定は同一テーブルにして下さい。','error');
					return;
				}
			settings.push({
				prefecture:$('select#prefecture',row).val(),
				prefecturename:$('select#prefecturename',row).val(),
				city:$('select#city',row).val(),
				cityname:$('select#cityname',row).val(),
				street:$('select#street',row).val(),
				streetname:$('select#streetname',row).val(),
				address:$('select#address',row).val(),
				zip:$('select#zip',row).val(),
				tablecode:tablecodes['prefecture']
			});
		}
		/* setup config */
		config['settings']=JSON.stringify(settings);
		/* save config */
		kintone.plugin.app.setConfig(config);
	});
	$('button#cancel').on('click',function(e){
		history.back();
	});
})(jQuery,kintone.$PLUGIN_ID);