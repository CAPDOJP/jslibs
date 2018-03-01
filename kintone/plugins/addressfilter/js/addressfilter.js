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
								list.append($('<option>').attr('value',record.id).html('&nbsp;'+record.name+'&nbsp;'));
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
								list.append($('<option>').attr('value',record.id).html('&nbsp;'+record.name+'&nbsp;'));
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
							for (var i=0;i<json.records.length;i++)
							{
								var record=json.records[i];
								list.append($('<option>').attr('value',record.id).html('&nbsp;'+record.name+'&nbsp;'));
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
		resetfields(list,setting,key,level,callback){
			if (level==0)
			{
				$('.input',$('.'+setting.prefecture+key)).val('');
				$('.input',$('.'+setting.city+key)).val('');
				$('.input',$('.'+setting.street+key)).val('');
				if (setting.prefecturename.length!=0) $('.input',$('.'+setting.prefecturename+key)).val('');
				if (setting.cityname.length!=0) $('.input',$('.'+setting.cityname+key)).val('');
				if (setting.streetname.length!=0) $('.input',$('.'+setting.streetname+key)).val('');
				if (setting.address.length!=0) $('.input',$('.'+setting.address+key)).val('');
				if (setting.zip.length!=0) $('.input',$('.'+setting.zip+key)).val('');
				$('.select',$('.'+setting.prefecture+key)).empty();
				$('.select',$('.'+setting.city+key)).empty();
				$('.select',$('.'+setting.street+key)).empty();
			}
			if (level==1)
			{
				$('.input',$('.'+setting.prefecture+key)).val(list.val());
				$('.input',$('.'+setting.city+key)).val('');
				$('.input',$('.'+setting.street+key)).val('');
				if (setting.prefecturename.length!=0) $('.input',$('.'+setting.prefecturename+key)).val($('option:selected',list).text().replace(/ /g,''));
				if (setting.cityname.length!=0) $('.input',$('.'+setting.cityname+key)).val('');
				if (setting.streetname.length!=0) $('.input',$('.'+setting.streetname+key)).val('');
				if (setting.address.length!=0) $('.input',$('.'+setting.address+key)).val('');
				if (setting.zip.length!=0) $('.input',$('.'+setting.zip+key)).val('');
				$('.select',$('.'+setting.city+key)).empty();
				$('.select',$('.'+setting.street+key)).empty();
			}
			if (level==2)
			{
				$('.input',$('.'+setting.city+key)).val(list.val());
				$('.input',$('.'+setting.street+key)).val('');
				if (setting.cityname.length!=0) $('.input',$('.'+setting.cityname+key)).val($('option:selected',list).text().replace(/ /g,''));
				if (setting.streetname.length!=0) $('.input',$('.'+setting.streetname+key)).val('');
				if (setting.address.length!=0) $('.input',$('.'+setting.address+key)).val('');
				if (setting.zip.length!=0) $('.input',$('.'+setting.zip+key)).val('');
				$('.select',$('.'+setting.street+key)).empty();
			}
			if (level==3)
			{
				$('.input',$('.'+setting.street+key)).val(list.val());
				if (setting.streetname.length!=0) $('.input',$('.'+setting.streetname+key)).val($('option:selected',list).text().replace(/ /g,''));
				if (setting.address.length!=0) $('.input',$('.'+setting.address+key)).val('');
				if (setting.zip.length!=0) $('.input',$('.'+setting.zip+key)).val('');
			}
			if (callback) callback();
		},
		/* setup filters */
		setupfilter:function(setting,records){
			$.each($('body').fields(setting.prefecture),function(index){
				var key='_'+index.toString();
				var list=null;
				var target=$(this).addClass('input');
				var container=target.closest('div').css({'width':'auto'}).addClass(setting.prefecture+key);
				var record=(records.length>index)?records[index]:null;
				if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
				if ($.data(target[0],'added')) return true;
				/* initialize valiable */
				list=vars.template.clone(true);
				$('select',list).addClass('select')
				.on('change',function(){
					functions.resetfields($('.select',list),setting,key,1,function(){
						functions.reloadcity($('.select',$('.'+setting.city+key)),$('.select',list).val());
					});
				});
				container.append(list);
				$.fieldcontainer(container,'NUMBER').css({'width':'auto'});
				functions.reloadprefecture($('.select',list),((record)?record[setting.prefecture].value:null));
				target.hide();
				$.data(target[0],'added',true);
			});
			$.each($('body').fields(setting.city),function(index){
				var key='_'+index.toString();
				var list=null;
				var target=$(this).addClass('input');
				var container=target.closest('div').css({'width':'auto'}).addClass(setting.city+key);
				var record=(records.length>index)?records[index]:null;
				if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
				if ($.data(target[0],'added')) return true;
				/* initialize valiable */
				list=vars.template.clone(true);
				$('select',list).addClass('select')
				.on('change',function(){
					functions.resetfields($('.select',list),setting,key,2,function(){
						functions.reloadstreet($('.select',$('.'+setting.street+key)),$('.select',$('.'+setting.prefecture+key)).val(),$('.select',list).val());
					});
				});
				container.append(list);
				$.fieldcontainer(container,'NUMBER').css({'width':'auto'});
				functions.reloadcity($('.select',list),((record)?record[setting.prefecture].value:null),((record)?record[setting.city].value:null));
				target.hide();
				$.data(target[0],'added',true);
			});
			$.each($('body').fields(setting.street),function(index){
				var key='_'+index.toString();
				var list=null;
				var target=$(this).addClass('input');
				var container=target.closest('div').css({'width':'auto'}).addClass(setting.street+key);
				var record=(records.length>index)?records[index]:null;
				if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
				if ($.data(target[0],'added')) return true;
				/* initialize valiable */
				list=vars.template.clone(true);
				$('select',list).addClass('select')
				.on('change',function(){
					functions.resetfields($('.select',list),setting,key,3,function(){
						var address='';
						if (setting.address.length!=0)
						{
							address+=$('.select option:selected',$('.'+setting.prefecture+key)).text().replace(/ /g,'');
							address+=$('.select option:selected',$('.'+setting.city+key)).text().replace(/ /g,'');
							address+=$('.select option:selected',$('.'+setting.street+key)).text().replace(/ /g,'');
							$('.input',$('.'+setting.address+key)).val(address);
						}
						if (setting.zip.length!=0) $('.input',$('.'+setting.zip+key)).val($('.select',list).val().substr(0,3)+'-'+$('.select',list).val().substr(3));
					});
				});
				container.append(list);
				$.fieldcontainer(container,'NUMBER').css({'width':'auto'});
				functions.reloadstreet($('.select',list),((record)?record[setting.prefecture].value:null),((record)?record[setting.city].value:null),((record)?record[setting.street].value:null));
				target.hide();
				$.data(target[0],'added',true);
			});
			if (setting.prefecturename.length!=0)
				$.each($('body').fields(setting.prefecturename),function(index){
					var key='_'+index.toString();
					var target=$(this).addClass('input');
					var container=target.closest('div').addClass(setting.prefecturename+key);
					if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
					if ($.data(target[0],'added')) return true;
					$.fieldcontainer(container,'SINGLE_LINE_TEXT').hide();
					$.data(target[0],'added',true);
				});
			if (setting.cityname.length!=0)
				$.each($('body').fields(setting.cityname),function(index){
					var key='_'+index.toString();
					var target=$(this).addClass('input');
					var container=target.closest('div').addClass(setting.cityname+key);
					if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
					if ($.data(target[0],'added')) return true;
					$.fieldcontainer(container,'SINGLE_LINE_TEXT').hide();
					$.data(target[0],'added',true);
				});
			if (setting.streetname.length!=0)
				$.each($('body').fields(setting.streetname),function(index){
					var key='_'+index.toString();
					var target=$(this).addClass('input');
					var container=target.closest('div').addClass(setting.streetname+key);
					if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
					if ($.data(target[0],'added')) return true;
					$.fieldcontainer(container,'SINGLE_LINE_TEXT').hide();
					$.data(target[0],'added',true);
				});
			if (setting.address.length!=0)
				$.each($('body').fields(setting.address),function(index){
					var key='_'+index.toString();
					var target=$(this).addClass('input');
					var container=target.closest('div').addClass(setting.address+key);
					if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
					if ($.data(target[0],'added')) return true;
					$.data(target[0],'added',true);
				});
			if (setting.zip.length!=0)
				$.each($('body').fields(setting.zip),function(index){
					var key='_'+index.toString();
					var target=$(this).addClass('input');
					var container=target.closest('div').addClass(setting.zip+key);
					if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
					if ($.data(target[0],'added')) return true;
					target.on('change',function(){
						functions.reloadzip(target.val(),function(record){
							functions.resetfields(null,setting,key,0,function(){
								functions.reloadprefecture($('.select',$('.'+setting.prefecture+key)),record.prefecture);
								functions.reloadcity($('.select',$('.'+setting.city+key)),record.prefecture,record.city);
								functions.reloadstreet($('.select',$('.'+setting.street+key)),record.prefecture,record.city,record.street);
								if (setting.prefecturename.length!=0) $('.input',$('.'+setting.prefecturename+key)).val(record.prefecturename);
								if (setting.cityname.length!=0) $('.input',$('.'+setting.cityname+key)).val(record.cityname);
								if (setting.streetname.length!=0) $('.input',$('.'+setting.streetname+key)).val(record.streetname);
								if (setting.address.length!=0) $('.input',$('.'+setting.address+key)).val(record.name);
								if (setting.zip.length!=0) $('.input',$('.'+setting.zip+key)).val(record.id.substr(0,3)+'-'+record.id.substr(3));
							});
						});
					});
					$.data(target[0],'added',true);
				});
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
				for (var i=0;i<event.record[setting.tablecode].value.length;i++) records.push(event.record[setting.tablecode].value[i].value);
			}
			/* setup filters */
			functions.setupfilter(setting,records);
			if (setting.tablecode.length!=0)
			{
				var events=[];
				events.push('app.record.create.change.'+setting.tablecode);
				events.push('app.record.edit.change.'+setting.tablecode);
				kintone.events.on(events,function(event){
					functions.setupfilter(setting);
					return event;
				});
			}
		}
	});
})(jQuery,kintone.$PLUGIN_ID);
