/*
*--------------------------------------------------------------------
* jQuery-Plugin "datesynclist"
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
		relations:[],
		events:[],
		config:{}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
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
				if ('relation' in vars.config)
				{
					vars.relations=JSON.parse(vars.config['relation']);
					for (var i=0;i<vars.relations.length;i++)
					{
						vars.events.push('app.record.create.change.'+vars.relations[i].date);
						vars.events.push('app.record.edit.change.'+vars.relations[i].date);
						vars.events.push('app.record.index.edit.change.'+vars.relations[i].date);
					}
					if (vars.events)
						kintone.events.on(vars.events,function(event){
							var type=event.type.split('.');
							for (var i=0;i<vars.relations.length;i++)
								if (type[type.length-1]==vars.relations[i].date)
								{
									var relation=vars.relations[i];
									if (event.record[relation.date].value) event.record[relation.dropdown].value=relation.item;
								}
							return event;
						});
				}
			}
			else swal('Error!','ライセンス認証に失敗しました。','error');
		},
		function(error){swal('Error!','ライセンス認証に失敗しました。','error');}
	);
})(jQuery,kintone.$PLUGIN_ID);
