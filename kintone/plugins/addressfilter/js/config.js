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
		},
		reloadprefecture:function(list,value,callback){
			list.empty();
			list.append($('<option>').attr('value','').html(''));
			kintone.proxy(
				'https://tis2010.jp/service/api/place/prefecture',
				'GET',
				{},
				{},
				function(body,status,headers){
					var json=JSON.parse(body);
					switch (status)
					{
						case 200:
							for (var i=0;i<json.records.length;i++)
							{
								var record=json.records[i];
								list.append($('<option>').attr('value',record.name).html(record.name));
							}
							if (value) list.val(value);
							if (callback) callback();
							break;
						default:
							swal('Error!',json.error.message,'error');
							break;
					}
				},
				function(error){
					swal('Error!','APIへの接続に失敗しました。','error');
				}
			);
		},
		reloadcity:function(list,prefecture,value,callback){
			list.empty();
			list.append($('<option>').attr('value','').html(''));
			if (!prefecture) return;
			kintone.proxy(
				'https://tis2010.jp/service/api/place/city?prefecture='+prefecture,
				'GET',
				{},
				{},
				function(body,status,headers){
					var json=JSON.parse(body);
					switch (status)
					{
						case 200:
							for (var i=0;i<json.records.length;i++)
							{
								var record=json.records[i];
								list.append($('<option>').attr('value',record.name).html(record.name));
							}
							if (value) list.val(value);
							if (callback) callback();
							break;
						default:
							swal('Error!',json.error.message,'error');
							break;
					}
				},
				function(error){
					swal('Error!','APIへの接続に失敗しました。','error');
				}
			);
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
							/* exclude lookup */
							if (!fieldinfo.lookup)
							{
								$('select#prefecture').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#city').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#street').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#address').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
								$('select#zip').append($('<option>').attr('value',fieldinfo.code).text(fieldinfo.label));
							}
					}
				}
			});
			/* initialize valiable */
			functions.reloadprefecture($('select#prefectureinit'),null,function(){
				vars.settingtable=$('.settings').adjustabletable({
					add:'img.add',
					del:'img.del',
					addcallback:function(row){
						$('select#prefectureinit',row).on('change',function(){
							var list=$('select#cityinit',row);
							var value=list.val();
							if ($.hasData(list[0]))
								if ($.data(list[0],'initialdata').length!=0)
								{
									value=$.data(list[0],'initialdata');
									$.data(list[0],'initialdata','');
								}
							functions.reloadcity($('select#cityinit',row),$(this).val(),value);
						});
					}
				});
				var add=false;
				var row=null;
				var settings=[];
				if (Object.keys(config).length!==0)
				{
					settings=JSON.parse(config['settings']);
					for (var i=0;i<settings.length;i++)
					{
						var init={
							city:settings[i].cityinit,
							prefecture:settings[i].prefectureinit,
						};
						if (add) vars.settingtable.addrow();
						else add=true;
						row=vars.settingtable.rows.last();
						$('select#prefecture',row).val(settings[i].prefecture);
						$('select#prefectureinit',row).val(init.prefecture);
						$('select#city',row).val(settings[i].city);
						$('select#street',row).val(settings[i].street);
						$('select#address',row).val(settings[i].address);
						$('select#zip',row).val(settings[i].zip);
						/* trigger events */
						$.data($('select#cityinit',row)[0],'initialdata',init.city);
						$('select#prefectureinit',row).trigger('change');
					}
				}
			});
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
				swal('Error!','都道府県を指定して下さい。','error');
				return;
			}
			if ($('select#city',row).val()=='')
			{
				swal('Error!','市区町村を指定して下さい。','error');
				return;
			}
			if ($('select#street',row).val()=='')
			{
				swal('Error!','町名を指定して下さい。','error');
				return;
			}
			tablecodes['prefecture']=($('select#prefecture',row).val().length!=0)?vars.fieldinfos[$('select#prefecture',row).val()].tablecode:'';
			tablecodes['city']=($('select#city',row).val().length!=0)?vars.fieldinfos[$('select#city',row).val()].tablecode:'';
			tablecodes['street']=($('select#street',row).val().length!=0)?vars.fieldinfos[$('select#street',row).val()].tablecode:'';
			tablecodes['address']=($('select#address',row).val().length!=0)?vars.fieldinfos[$('select#address',row).val()].tablecode:'';
			tablecodes['zip']=($('select#zip',row).val().length!=0)?vars.fieldinfos[$('select#zip',row).val()].tablecode:'';
			if (tablecodes['prefecture']!=tablecodes['city'])
			{
				swal('Error!','都道府県と市区町村の指定は同一テーブルにして下さい。','error');
				return;
			}
			if (tablecodes['prefecture']!=tablecodes['street'])
			{
				swal('Error!','都道府県と町名の指定は同一テーブルにして下さい。','error');
				return;
			}
			if ($('select#address',row).val().length!=0)
				if (tablecodes['prefecture']!=tablecodes['address'])
				{
					swal('Error!','都道府県と連結住所の指定は同一テーブルにして下さい。','error');
					return;
				}
			if ($('select#zip',row).val().length!=0)
				if (tablecodes['prefecture']!=tablecodes['zip'])
				{
					swal('Error!','都道府県と郵便番号の指定は同一テーブルにして下さい。','error');
					return;
				}
			settings.push({
				prefecture:$('select#prefecture',row).val(),
				prefectureinit:$('select#prefectureinit',row).val(),
				city:$('select#city',row).val(),
				cityinit:$('select#cityinit',row).val(),
				street:$('select#street',row).val(),
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