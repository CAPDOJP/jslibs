/*
*--------------------------------------------------------------------
* jQuery-Plugin "lookuplinked"
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
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		config:{},
		fieldinfos:{},
		params:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show'
		]
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		kintone.proxy(
			vars.config['license']+'?domain='+$(location).attr('host').replace(/\.cybozu\.com/g,''),
			'GET',
			{},
			{},
			function(body,status,headers){
				if (status>=200 && status<300)
				{
					var json=JSON.parse(body);
					if (parseInt('0'+json.permit)==0) {swal('Error!','ライセンスが登録されていません。','error');return;}
					/* get fieldinfo */
					kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
						vars.fieldinfos=$.fieldparallelize(resp.properties);
						var target=$('body').fields(vars.config.copyfrom)[0];
						$.data(target[0],'value',event.record[vars.config.copyfrom].value);
						setInterval(function(){
							var value=(target.val())?target.val():'';
							if ($.data(target[0],'value')==null) $.data(target[0],'value','');
							if ($.data(target[0],'value')==value) return;
							$.data(target[0],'value',value);
							if (value.length!=0)
							{
								$.each($('body').fields(vars.config.copyto),function(index){
									$(this).val(value);
									$(this).parent().parent().find('button').eq(0).trigger('click');
								});
							}
						},250);
						var events=[];
						events.push('app.record.create.change.'+vars.fieldinfos[vars.config.copyto].tablecode);
						events.push('app.record.edit.change.'+vars.fieldinfos[vars.config.copyto].tablecode);
						kintone.events.on(events,function(event){
							event.changes.row.value[vars.config.copyto].value=event.record[vars.config.copyfrom].value;
							event.changes.row.value[vars.config.copyto].lookup=true;
							return event;
						});
					},function(error){});
				}
				else swal('Error!','ライセンス認証に失敗しました。','error');
			},
			function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
		);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
