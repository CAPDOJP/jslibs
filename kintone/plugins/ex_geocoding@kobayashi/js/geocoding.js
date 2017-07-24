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
		isdisplaymap:false,
		infowindow:null,
		currentlocation:null,
		map:null,
		displaymap:null,
		config:{},
		markers:[]
	};
	var events={
		lists:[
			'app.record.index.show',
			'mobile.app.record.index.show'
		],
		show:[
			'app.record.create.show',
			'app.record.edit.show',
			'app.record.detail.show',
			'mobile.app.record.create.show',
			'mobile.app.record.edit.show',
			'mobile.app.record.detail.show'
		],
		save:[
			'app.record.create.submit',
			'app.record.edit.submit',
			'mobile.app.record.create.submit',
			'mobile.app.record.edit.submit'
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
				$.ajax({
					url:'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&language=ja&address='+encodeURI(options.address),
					type:'get',
					datatype:'json'
				})
				.done(function(json){
					switch (json.status)
					{
						case 'ZERO_RESULTS':
							break;
						case 'OVER_QUERY_LIMIT':
							alert('リクエストが割り当て量を超えています。');
							break;
						case 'REQUEST_DENIED':
							alert('リクエストが拒否されました。');
							break;
						case 'INVALID_REQUEST':
							alert('クエリが不足しています。');
							break;
						case 'OK':
							var latlng=json.results[0].geometry.location.lat+','+json.results[0].geometry.location.lng;
							var src='https://maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+encodeURI(options.address)+'@'+latlng+'&amp;ie=UTF8&amp;ll='+latlng+'&amp;z=14&amp;t=m&amp;output=embed';
							vars.map.empty();
							vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
							if (options.callback!=null) options.callback(json);
							break;
					}
				})
				.fail(function(){alert('地図座標取得に失敗しました。');});
			if (options.latlng.length!=0)
			{
				var src='https://maps.google.co.jp/maps?f=q&amp;hl=ja&amp;q='+options.latlng+'&amp;ie=UTF8&amp;ll='+options.latlng+'&amp;z=14&amp;t=m&amp;output=embed';
				vars.map.empty();
				vars.map.append($('<iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="'+src+'"></iframe>').css({'height':'100%','width':'100%'}));
			}
		},
		/* swtich view of marker */
		reloadmap:function(){
			if (vars.currentlocation.find('input[type=checkbox]').prop('checked'))
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
					vars.map.reloadmap({markers:markers,markerfontsize:11,isopeninfowindow:vars.infowindow.find('input[type=checkbox]').prop('checked')});
				}});
			}
			else
			{
				/* display map */
				vars.map.reloadmap({markers:vars.markers,markerfontsize:11,isopeninfowindow:vars.infowindow.find('input[type=checkbox]').prop('checked')});
			}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.lists,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		/* check display map */
		if (!'map' in vars.config) return event;
		if (vars.config['map']!='1') return event;
		/* initialize valiable */
		vars.markers=[];
		/* create currentlocation checkbox */
		vars.currentlocation=$('<label class="customview-checkbox">')
		.append($('<input type="checkbox" id="currentlocation">')
			.on('change',function(e){
				/* swtich view of marker */
				functions.reloadmap();
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
		/* create display map button */
		vars.displaymap=$('<button class="kintoneplugin-button-dialog-ok">')
		.text('地図を表示')
		.on('click',function(e){vars.isdisplaymap=true;functions.reloadmap();});
		/* create map */
		var isreload=(vars.map!=null);
		if (isreload) vars.map.container.remove();
		vars.map=$('body').routemap(vars.config['apikey'],true,false,function(){
			/* create map */
			$.each(event.records,function(index,values){
				var record=values
				var lat=parseFloat('0'+record[vars.config['lat']].value);
				var lng=parseFloat('0'+record[vars.config['lng']].value);
				var label='';
				if (lat+lng!=0)
				{
					label='';
					label+=(vars.config['information'])?record[vars.config['information']].value:record[vars.config['address']].value;
					label+='<br><a href="https://'+$(location).attr('host')+'/k/'+kintone.app.getId()+'/show#record='+record['$id'].value+'" target="_blank">詳細画面へ</a>';
					vars.markers.push({
						colors:6,
						label:label,
						lat:lat,
						lng:lng
					});
				}
			});
		},isreload);
		vars.map.buttonblock
		.prepend(vars.infowindow)
		.prepend(vars.currentlocation)
		.find('#mapclose').on('click',function(){vars.isdisplaymap=false;});
		/* append elements */
		kintone.app.getHeaderMenuSpaceElement().innerHTML='';
		kintone.app.getHeaderMenuSpaceElement().appendChild(vars.displaymap[0]);
		/* chase mode */
		if (vars.config['chasemode']=='1' && $.isNumeric(vars.config['chasetimespan']))
		{
			var timespan=parseFloat(vars.config['chasetimespan'])*1000;
	        setInterval(function(){
				/* swtich view of marker */
				if (vars.isdisplaymap)
					if (vars.currentlocation.find('input[type=checkbox]').prop('checked')) functions.reloadmap();
	        },timespan);
		}
		return event;
	});
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* hide elements  */
		kintone.app.record.setFieldShown(vars.config['lat'],false);
		kintone.app.record.setFieldShown(vars.config['lng'],false);
		/* map action  */
		vars.map=$('<div id="map">').css({'height':'100%','width':'100%'});
		/* the initial display when editing */
		if (event.type.match(/(edit|detail)/g)!=null) functions.displaymap({latlng:event.record.lat.value+','+event.record.lng.value});
		/* display map in value change event */
		if (event.type.match(/(create|edit)/g)!=null)
			$('body').fields(vars.config['address'])[0].on('change',function(){
				var target=$(this);
				functions.displaymap({
					address:target.val(),
					callback:function(json){
						$('body').fields(vars.config['lat'])[0].val(json.results[0].geometry.location.lat);
						$('body').fields(vars.config['lng'])[0].val(json.results[0].geometry.location.lng);
					}
				});
			});
		kintone.app.record.getSpaceElement(vars.config['spacer']).appendChild(vars.map[0]);
		return event;
	});
	kintone.events.on(events.save,function(event){
		return new kintone.Promise(function(resolve,reject){
			kintone.proxy(
				'https://maps.googleapis.com/maps/api/geocode/json?sensor=false&language=ja&address='+encodeURI(event.record[vars.config['address']].value),
				'GET',
				{},
				{},
				function(body,status,headers){
					if (status>=200 && status<300){
						var json=body.replace(/^\s+|\s+$/g,'');
						var results=JSON.parse(json).results;
						var lat=results[0].geometry.location.lat
						var lng=results[0].geometry.location.lng;
						event.record[vars.config['lat']].value=lat;
						event.record[vars.config['lng']].value=lng;
						resolve(event);
					}
				}
			);
		});
	});
})(jQuery,kintone.$PLUGIN_ID);
