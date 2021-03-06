/*
*--------------------------------------------------------------------
* jQuery-Plugin "geocoding"
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
		istransit:false,
		infowindow:null,
		currentlocation:null,
		latlngmap:null,
		map:null,
		config:{},
		fieldinfos:{},
		events:[],
		markers:[]
	};
	var events={
		lists:[
			'app.record.index.show'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'app.record.detail.show'
		]
	};
	var functions={
		/* display map */
		displaymap:function(options){
			var options=$.extend({
				address:'',
				latlng:'',
				callback:null
			},options);
			if (options.address.length!=0)
				vars.latlngmap.inaddress({
					address:options.address,
					callback:function(result){
						var lat=result.geometry.location.lat();
						var lng=result.geometry.location.lng();
						var src='https://maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+encodeURIComponent(options.address)+'@'+lat+','+lng+'&amp;ie=UTF8&amp;ll='+lat+','+lng+'&amp;z=14&amp;t=m&amp;output=embed';
						if (vars.map!=null)
						{
							vars.map.empty();
							vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
						}
						if (options.callback!=null) options.callback(result);
					}
				})
			if (options.latlng.length!=0)
				if (vars.map!=null)
				{
					var src='https://maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+options.latlng+'&amp;ie=UTF8&amp;ll='+options.latlng+'&amp;z=14&amp;t=m&amp;output=embed';
					vars.map.empty();
					vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
				}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
	kintone.events.on(events.lists,function(event){
		if (!vars.config) return event;
		/* check display map */
		if (!'map' in vars.config) return event;
		if (vars.config['map']!='1') return event;
		else
		{
			if ('excludeview' in vars.config)
				if ($.inArray(event.viewId.toString(),JSON.parse(vars.config['excludeview']))>-1) return event;
		}
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			/* initialize valiable */
			vars.markers=[];
			/* create currentlocation checkbox */
			vars.currentlocation=$('<label class="customview-checkbox">')
			.append($('<input type="checkbox" id="currentlocation">')
				.on('change',function(e){
					if ($(this).prop('checked'))
					{
						vars.map.currentlocation({callback:function(latlng){
							var markers=$.extend(true,[],vars.markers);
							/* start from current location */
							markers.unshift({
								colors:0,
								label:'現在地',
								lat:latlng.lat(),
								lng:latlng.lng(),
								serialnumber:false
							});
							/* display map */
							vars.map.reloadmap({markers:markers,isopeninfowindow:$('#infowindow').prop('checked')});
						}});
					}
					else
					{
						/* display map */
						vars.map.reloadmap({markers:vars.markers,isopeninfowindow:$('#infowindow').prop('checked')});
					}
				})
			)
			.append($('<span>現在地を表示</span>'));
			/* create informationwindow checkbox */
			vars.infowindow=$('<label class="customview-checkbox">')
			.append($('<input type="checkbox" id="infowindow">')
				.on('change',function(e){
					if ($(this).prop('checked')) vars.map.openinfowindow();
					else vars.map.closeinfowindow();
				})
			)
			.append($('<span>情報ウインドウを表示</span>'));
			/* create map controller */
			var mapcontainer=$('<div id="map">').css({'height':vars.config['mapheight']+'vh','width':'100%'});
			var isreload=(vars.map!=null);
			var colors=('colors' in vars.config)?JSON.parse(vars.config['colors']):[];
			vars.map=mapcontainer.routemap(vars.config['apikey'],false,false,function(){
				/* create map */
				$.each(event.records,function(index,values){
					var record=values
					var lat=parseFloat('0'+record[vars.config['lat']].value);
					var lng=parseFloat('0'+record[vars.config['lng']].value);
					var informations=JSON.parse(vars.config['information']);
					var color='0';
					var label='';
					if (lat+lng!=0)
					{
						for (var i=0;i<colors.length;i++)
						{
							var match=$.conditionsmatch(record,vars.fieldinfos,JSON.parse(colors[i].conditions));
							if (match) color=colors[i].color;
						}
						if (informations.length==0) label+=record[vars.config['address']].value;
						else
						{
							for (var i=0;i<informations.length;i++) label+=record[informations[i]].value+'<br>';
							label=label.replace(/\<br\>$/g,'');
						}
						label+='<br><a href="'+kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/show#record='+record['$id'].value+'" target="_blank">詳細画面へ</a>';
						vars.markers.push({
							colors:color,
							label:label,
							lat:lat,
							lng:lng
						});
					}
				});
				if (vars.markers.length==0) return;
				/* display map */
				vars.map.reloadmap({markers:vars.markers,isopeninfowindow:$('#infowindow').prop('checked')});
			},
			isreload,
			function(results,latlng){
				if (vars.config['usegeocoder']!='1') return;
				var query='';
				query+=vars.config['address']+'='+results.formatted_address.replace(/日本(,|、)[ ]*〒[0-9]{3}-[0-9]{4}[ ]*/g,'');
				query+='&'+vars.config['lat']+'='+latlng.lat();
				query+='&'+vars.config['lng']+'='+latlng.lng();
				window.location.href=kintone.api.url('/k/', true).replace(/\.json/g,'')+kintone.app.getId()+'/edit?'+query;
			});
			/* append elements */
			if ($('.customview-checkbox').size()) $('.customview-checkbox').remove();
			kintone.app.getHeaderMenuSpaceElement().appendChild(vars.currentlocation[0]);
			kintone.app.getHeaderMenuSpaceElement().appendChild(vars.infowindow[0]);
			if (!isreload) kintone.app.getHeaderSpaceElement().appendChild(mapcontainer[0]);
		},function(error){swal('Error!',error.message,'error');});
		return event;
	});
	kintone.events.on(events.show,function(event){
		if (!vars.config) return false;
		/* get query strings */
		var queries=$.queries();
		if (vars.config['address'] in queries) {event.record[vars.config['address']].value=queries[vars.config['address']];vars.istransit=true;}
		if (vars.config['lat'] in queries) {event.record[vars.config['lat']].value=queries[vars.config['lat']];vars.istransit=true;}
		if (vars.config['lng'] in queries) {event.record[vars.config['lng']].value=queries[vars.config['lng']];vars.istransit=true;}
		/* hide elements  */
		kintone.app.record.setFieldShown(vars.config['lat'],false);
		kintone.app.record.setFieldShown(vars.config['lng'],false);
		/* map action  */
		vars.map=$('<div id="map">').css({'height':'100%','width':'100%'});
		vars.latlngmap=$('body').routemap(vars.config['apikey'],false,false,function(){
			/* the initial display when editing */
			if (event.type.match(/(edit|detail)/g)!=null || vars.istransit) functions.displaymap({latlng:event.record[vars.config['lat']].value+','+event.record[vars.config['lng']].value});
			if ('address' in vars.config)
			{
				vars.events.push('app.record.create.change.'+vars.config['address']);
				vars.events.push('mobile.app.record.create.change.'+vars.config['address']);
				vars.events.push('app.record.edit.change.'+vars.config['address']);
				vars.events.push('mobile.app.record.edit.change.'+vars.config['address']);
				/* display map in value change event */
				kintone.events.on(vars.events,function(event){
					var type=event.type.split('.');
					if (type[type.length-1]!=vars.config['address']) return event;
					if (!vars.istransit)
					{
						if (event.changes.field.value)
						{
							functions.displaymap({
								address:event.changes.field.value,
								callback:function(result){
									var record=(event.type.match(/mobile/g)!=null)?kintone.mobile.app.record.get():kintone.app.record.get();
									record.record[vars.config['lat']].value=result.geometry.location.lat();
									record.record[vars.config['lng']].value=result.geometry.location.lng();
									if (event.type.match(/mobile/g)!=null) kintone.mobile.app.record.set(record);
									else kintone.app.record.set(record);
								}
							});
						}
						else
						{
							event.record[vars.config['lat']].value=null;
							event.record[vars.config['lng']].value=null;
						}
					}
					vars.istransit=false;
					return event;
				});
				vars.latlngmap.container.hide();
			}
		},$('script#mapscript').size());
		kintone.app.record.getSpaceElement(vars.config['spacer']).appendChild(vars.map[0]);
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
