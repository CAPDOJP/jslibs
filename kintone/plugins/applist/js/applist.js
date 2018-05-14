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
		createcategory:function(caption){
			return $('<div>').addClass('category').append($('<p>').addClass('categorycaption').text(caption));
		},
		createlink:function(appid,appname,viewid,viewname){
			var extendurl='';
			var extendname='';
			if (viewid)
			{
				extendurl='/?view='+viewid;
				extendname=viewname+'@';
			}
			return $('<a href="https://'+$(location).attr('host')+'/k/'+appid+extendurl+'" target="_blank">').text(extendname+appname);
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
		var container=$('div#applist-container').addClass('categorycontainer').empty();
		var categories=JSON.parse(vars.config['category']);
		var added=[];
		/* append links */
		for (var i=0;i<categories.length;i++)
		{
			var category=categories[i];
			var contents=functions.createcategory(category.name);
			for (var i2=0;i2<category.apps.length;i2++)
			{
				var apps=category.apps[i2];
				contents.append(functions.createlink(apps.app.id,apps.app.name,apps.view.id,apps.view.name));
				added.push(apps.app.id);
			}
			container.append(contents);
		}
		if (vars.config['addothers']=='1')
			functions.loadapps(function(){
				if (vars.apps.length!=added.length)
				{
					var contents=functions.createcategory('その他');
					for (var i=0;i<vars.apps.length;i++)
						if (added.indexOf(vars.apps[i].appId)<0) contents.append(functions.createlink(vars.apps[i].appId,vars.apps[i].name));
					container.append(contents);
				}
			});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
