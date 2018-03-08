/*
*--------------------------------------------------------------------
* jQuery-Plugin "addressfilter"
* Version: 1.0
* Copyright (c) 2018 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		template:null,
		config:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	var functions={
		/* reload prefecture */
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
								list.append($('<option>').attr('value',record.name).html('&nbsp;'+record.name+'&nbsp;'));
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
		/* reload city */
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
								list.append($('<option>').attr('value',record.name).html('&nbsp;'+record.name+'&nbsp;'));
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
		/* reload street */
		reloadstreet:function(list,prefecture,city,value,callback){
			list.empty();
			list.append($('<option>').attr('value','').html(''));
			if (!prefecture) return;
			if (!city) return;
			kintone.proxy(
				'https://tis2010.jp/service/api/place/street?prefecture='+prefecture+'&city='+city,
				'GET',
				{},
				{},
				function(body,status,headers){
					var json=JSON.parse(body);
					switch (status)
					{
						case 200:
							var zips={};
							for (var i=0;i<json.records.length;i++)
							{
								var record=json.records[i];
								list.append($('<option>').attr('value',record.name).html('&nbsp;'+((record.name.length!=0)?record.name:'以下に掲載がない住所')+'&nbsp;'));
								zips[record.name]=record.id;
							}
							$.data(list[0],'zips',JSON.stringify(zips));
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
		/* reload zip */
		reloadzip:function(zip,callback){
			if (!zip) return;
			zip=parseInt(zip.replace(/[^0-9０-９]/g,'')).toString();
			kintone.proxy(
				'https://tis2010.jp/service/api/place/zip?search='+zip,
				'GET',
				{},
				{},
				function(body,status,headers){
					var json=JSON.parse(body);
					switch (status)
					{
						case 200:
							if (json.records.length!=0)
							{
								if (callback) callback(json.records[0]);
							}
							else swal('Error!','入力された郵便番号に該当する住所が見つかりませんでした。','error');
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
		/* reset fields */
		resetfields(list,prefecture,city,street,address,zip,level,callback){
			if (level==0)
			{
				prefecture.input.val('');
				city.input.val('');
				street.input.val('');
				if (address.input) address.input.val('');
				if (zip.input) zip.input.val('');
				$('select',prefecture.list).empty();
				$('select',city.list).empty();
				$('select',street.list).empty();
			}
			if (level==1)
			{
				prefecture.input.val(list.val());
				city.input.val('');
				street.input.val('');
				if (address.input) address.input.val('');
				if (zip.input) zip.input.val('');
				$('select',city.list).empty();
				$('select',street.list).empty();
			}
			if (level==2)
			{
				city.input.val(list.val());
				street.input.val('');
				if (address.input) address.input.val('');
				if (zip.input) zip.input.val('');
				$('select',street.list).empty();
			}
			if (level==3)
			{
				street.input.val(list.val());
				if (address.input) address.input.val('');
				if (zip.input) zip.input.val('');
			}
			if (callback) callback();
		},
		/* setup filters */
		setupfilter:function(setting,records,create){
			$.each($('body').fields(setting.prefecture),function(index){
				var target=$(this);
				var container=(setting.tablecode.length!=0)?target.closest('tr'):$('body');
				var prefecture={
					container:null,
					input:null,
					list:vars.template.clone(true)
				};
				var city={
					container:null,
					input:null,
					list:vars.template.clone(true)
				};
				var street={
					container:null,
					input:null,
					list:vars.template.clone(true)
				};
				var address={
					container:null,
					input:null,
				};
				var zip={
					container:null,
					input:null,
				};
				var initialvalues=functions.setupinitialvalues(setting,records,create,index);
				if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
				if ($.data(target[0],'added')) return true;
				prefecture.input=target;
				prefecture.container=prefecture.input.closest('div').css({'width':'auto'});
				city.input=container.fields(setting.city)[0];
				city.container=city.input.closest('div').css({'width':'auto'});
				street.input=container.fields(setting.street)[0];
				street.container=street.input.closest('div').css({'width':'auto'});
				if (setting.address.length!=0)
				{
					address.input=container.fields(setting.address)[0];
					address.container=address.input.closest('div');
				}
				if (setting.zip.length!=0)
				{
					zip.input=container.fields(setting.zip)[0];
					zip.container=zip.input.closest('div');
				}
				$('select',prefecture.list)
				.on('change',function(){
					functions.resetfields($('select',prefecture.list),prefecture,city,street,address,zip,1,function(){
						functions.reloadcity($('select',city.list),$('select',prefecture.list).val());
					});
				});
				$('select',city.list)
				.on('change',function(){
					functions.resetfields($('select',city.list),prefecture,city,street,address,zip,2,function(){
						functions.reloadstreet($('select',street.list),$('select',prefecture.list).val(),$('select',city.list).val());
					});
				});
				$('select',street.list)
				.on('change',function(){
					functions.resetfields($('select',street.list),prefecture,city,street,address,zip,3,function(){
						var addressvalue='';
						if (setting.address.length!=0)
						{
							addressvalue+=$('select option:selected',prefecture.list).val();
							addressvalue+=$('select option:selected',city.list).val();
							addressvalue+=$('select option:selected',street.list).val();
							address.input.val(addressvalue);
						}
						if (setting.zip.length!=0)
						{
							var zipvalue=JSON.parse($.data($('select',street.list)[0],'zips'))[$('select',street.list).val()];
							zip.input.val(zipvalue.substr(0,3)+'-'+zipvalue.substr(3));
						}
					});
				});
				zip.input.on('change',function(){
					functions.reloadzip(zip.input.val(),function(record){
						functions.resetfields(null,prefecture,city,street,address,zip,0,function(){
							functions.reloadprefecture($('select',prefecture.list),record.prefecturename);
							functions.reloadcity($('select',city.list),record.prefecturename,record.cityname);
							functions.reloadstreet($('select',street.list),record.prefecturename,record.cityname,record.streetname);
							prefecture.input.val(record.prefecturename);
							city.input.val(record.cityname);
							street.input.val(record.streetname);
							if (setting.address.length!=0) address.input.val(record.name);
							if (setting.zip.length!=0) zip.input.val(record.id.substr(0,3)+'-'+record.id.substr(3));
						});
					});
				});
				prefecture.container.append(prefecture.list);
				city.container.append(city.list);
				street.container.append(street.list);
				prefecture.input.hide();
				city.input.hide();
				street.input.hide();
				$('body').fieldcontainer(prefecture.container,'SINGLE_LINE_TEXT').css({'width':'auto'});
				$('body').fieldcontainer(city.container,'SINGLE_LINE_TEXT').css({'width':'auto'});
				$('body').fieldcontainer(street.container,'SINGLE_LINE_TEXT').css({'width':'auto'});
				functions.reloadprefecture($('select',prefecture.list),initialvalues.prefecture,function(){
					if (create) prefecture.input.val(initialvalues.prefecture);
				});
				functions.reloadcity($('select',city.list),initialvalues.prefecture,initialvalues.city,function(){
					if (create) city.input.val(initialvalues.city);
				});
				functions.reloadstreet($('select',street.list),initialvalues.prefecture,initialvalues.city,initialvalues.street);
				$.data(target[0],'added',true);
			});
		},
		/* setup initialvalues */
		setupinitialvalues:function(setting,records,create,index){
			var res={};
			if (create)
			{
				res['prefecture']=((setting.prefectureinit.length!=0)?setting.prefectureinit:null);
				res['city']=((setting.cityinit.length!=0)?setting.cityinit:null);
				res['street']=null;
			}
			else
			{
				res['prefecture']=records[index][setting.prefecture].value;
				res['city']=records[index][setting.city].value;
				res['street']=records[index][setting.street].value;
			}
			return res;
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* initialize valiable */
		vars.template=$('<div class="kintoneplugin-select-outer addressfilter">').append($('<div class="kintoneplugin-select">').append($('<select>')));
		var settings=JSON.parse(vars.config['settings']);
		for (var i=0;i<settings.length;i++)
		{
			var setting=settings[i];
			var records=[event.record];
			if (setting.tablecode.length!=0)
			{
				records=[];
				for (var i2=0;i2<event.record[setting.tablecode].value.length;i2++) records.push(event.record[setting.tablecode].value[i2].value);
			}
			/* setup filters */
			functions.setupfilter(setting,records,(event.type.match(/create/g)!=null));
			if (setting.tablecode.length!=0)
			{
				var events=[];
				events.push('app.record.create.change.'+setting.tablecode);
				events.push('app.record.edit.change.'+setting.tablecode);
				kintone.events.on(events,function(event){
					functions.setupfilter(setting,[],true);
					return event;
				});
			}
		}
	});
})(jQuery,kintone.$PLUGIN_ID);
