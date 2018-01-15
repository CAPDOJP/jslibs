/*
*--------------------------------------------------------------------
* jQuery-Plugin "applist"
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
		offset:0,
		apps:[],
		config:{}
	};
	var events={
		lists:[
			'app.record.index.show'
		]
	};
	var functions={
		creategroup:function(caption){
			return $('<div>').addClass('group').append($('<p>').addClass('groupcaption').text(caption));
		},
		createlink:function(app){
			return $('<a href="https://'+$(location).attr('host')+'/k/'+app.appId+'">').text(app.name);
		},
		loadapps:function(callback){
			kintone.api(kintone.api.url('/k/v1/apps',true),'GET',{offset:vars.offset},function(resp){
				Array.prototype.push.apply(vars.apps,resp.apps);
				vars.offset+=100;
				if (resp.apps.length==100) functions.loadapps(callback);
				else callback();
			},function(error){});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* check viewid */
		if (event.viewId!=vars.config.applist) return;
		/* initialize valiable */
		var container=$('div#applist-container').addClass('groupcontainer').empty();
		var groups=JSON.parse(vars.config['group']);
		functions.loadapps(function(){
			var added=[];
			/* sort */
			vars.apps.sort(function(a,b){
				if(a.appId<b.appId) return -1;
				if(a.appId>b.appId) return 1;
				return 0;
			});
			/* append links */
			for (var i=0;i<groups.length;i++)
			{
				var group=groups[i];
				var filter=$.grep(vars.apps,function(item,index){
					var exists=false;
					for (var i2=0;i2<group.apps.length;i2++) if (item.appId==group.apps[i2]) {exists=true;break;}
					return exists;
				});
				var contents=functions.creategroup(group.name);
				if (filter.length!=0)
				{
					for (var i2=0;i2<filter.length;i2++)
					{
						contents.append(functions.createlink(filter[i2]));
						added.push(filter[i2].appId);
					}
				}
				container.append(contents);
			}
			if (vars.apps.length!=added.length)
			{
				var contents=functions.creategroup('その他');
				for (var i=0;i<vars.apps.length;i++)
					if (added.indexOf(vars.apps[i].appId)<0) contents.append(functions.createlink(vars.apps[i]));
				container.append(contents);
			}
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
