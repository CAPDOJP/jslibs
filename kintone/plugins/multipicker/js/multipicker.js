/*
*--------------------------------------------------------------------
* jQuery-Plugin "multipicker"
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
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		limit:500,
		offset:0,
		multiselecter:null,
		settings:[],
		config:{},
		fieldinfos:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	var functions={
		/* load app datas */
		loaddatas:function(fieldinfo,records,callback){
			var body={
				app:fieldinfo.lookup.relatedApp.app,
				query:''
			};
			body.query+=fieldinfo.lookup.filterCond;
			body.query+=' order by '+((fieldinfo.lookup.sort)?fieldinfo.lookup.sort:'$id asc');
			body.query+=' limit '+vars.limit.toString();
			body.query+=' offset '+vars.offset.toString();
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(records,resp.records);
				vars.offset+=vars.limit;
				if (resp.records.length==vars.limit) functions.loaddatas(fieldinfo,records,callback);
				else callback(records);
			},function(error){
				swal('Error!',error.message,'error');
			});
		},
		/* setup button */
		setupbutton:function(setting){
			$.each($('body').fields(setting.connected),function(index){
				var parent=$(this).closest('div');
				var target=$(this);
				var rects={
					parent:parent[0].getBoundingClientRect(),
					target:target[0].getBoundingClientRect()
				};
				if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
				if ($.data(target[0],'added')) return true;
				target.css({
					'padding-right':target.outerHeight(false).toString()+'px',
					'position':'relative',
					'z-index':'1'
				});
				parent.css({'position':'relative'})
				.append(
					$('<img>').css({
						'background-color':'transparent',
						'border':'none',
						'box-sizing':'border-box',
						'cursor':'pointer',
						'display':'block',
						'height':target.outerHeight(false).toString()+'px',
						'margin':'0px',
						'position':'absolute',
						'right':(rects.parent.right-rects.target.right).toString()+'px',
						'top':((rects.parent.top-rects.target.top)*-1).toString()+'px',
						'width':target.outerHeight(false).toString()+'px',
						'z-index':'2'
					})
					.attr('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAFN++nkAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA7BJREFUeNpiYKAa6J8yMQFK/yfbhP9Qej7RigkpOk+U1QABRLnf92MTZ4LSDkgKHbDpNiDoHZACvIqIChCAAKIIMeLwNtxHhTn5jCTFNHoo4FLPRISZ58mJNQdCwctIauIlKRzwAYAAGqKIkUBcNwIDp4GsRAIqFoC4gBiNAaTmEOQUZkBpWfCeXJtB4AFSMRgAYoNSE9Zyg5R0TVbaRteEnK4JZkn0TAA0rIGcwPxP+4KNWAAQQKO5mVCeg2WdA8DYP0Azi6FZTACILwAtMkQSB4ndxyZHjfbNf2LaE1RNsqBMQ4phUMsdSLEDV04+gBSkRJW3pMY5E45iA2RIIxC/x9cQhEbFeiB2pHqqhlYz/TikHUGOhLZXzpNS6TNSIT2A4nY/MQUuVS0mpibD5gCqt4NwOCARaPkCuhSJ0CyZMFo5wABAAI2iUTCwLRBoLVWAVBI10NRioIUK0JYG0UUhxRaj1TiBQEs2oLWu66FcQaDcB1ItZiHUu8bmK2hQw1op78kp85lw+HY9kUGpiFRnU24xEICaMwSDD+iwBzC3UstiEJhIpBlkta+ZqJAlBahtcT2RZhhQ0+IFxDRvkdrSgVSxGJhoEqHM9wRKs/1Q9RuoGdSCSL2E+WiW7oc5Cpbl8A3Jkduufo8jAT0AWqqIRQ1RDTtSuqmw+PwANPgCWm/CgNRWJTUa9Lja03gtp0Y+xpWi5+Nr3lJsMTRFJ5JqOTV8zAANUpyW08xiIiynncV4LBekW0MO1GQiawxwFAwrABCgXau9QRCIoYQJWMENdAJlBCZQJjCOwAZugE4AG+AGygSs4AjapJra8HF3HEcx96J/jCR91uu1r8+/PDw8/k+FUGw+jzhg9gGGT+iSMjJkLoMwzgxVS5v/xKG1Jp9tA+IfIIDOPDYRMZwRRgnozogq77dxysvZvwE2Z7E4wi17h2yMyMacI5Dl1dTZDjWCixjZZKyiiFm9EAmlmjrDOvMDlc5KE9FhQOwArHU3k1MSpqgtx3FzVbRMCW8tDnURq+AyzjCe108wO4uTZ8GOykNSlYYrqWEBJiMy25Dr7SvRiWs8WuQ7OIOpSveERalg9/j5/exJeqcVYeC7gUIUBd3i+Q9R7N5y8v0n/pDl7IRbyB/e733QvxmAwK+cQE+bSmHFVjC7F5RbVRQwirgI82vPrsE6cTFuXxTPc4NHtYiLszcbEofitlG5JUJphCFbuKdLNR77FM3lZdgw48om0MU49juIO1dMPDw8PJziBXvFttyY+HdhAAAAAElFTkSuQmCC')
					.on('click',function(){
						var fieldinfo=vars.fieldinfos[setting.lookup];
						vars.offset=0;
						functions.loaddatas(fieldinfo,[],function(records){
							var datasource=[];
							var displaytext=fieldinfo.lookup.lookupPickerFields;
							if (displaytext.length==0) displaytext=[fieldinfo.lookup.relatedKeyField];
							else
							{
								if (displaytext.indexOf(fieldinfo.lookup.relatedKeyField)<0)
									displaytext.push(fieldinfo.lookup.relatedKeyField);
							}
							for (var i=0;i<records.length;i++)
							{
								var record=records[i];
								datasource.push({});
								for (var i2=0;i2<displaytext.length;i2++) datasource[i][displaytext[i2]]=$.fieldvalue(record[displaytext[i2]]);
							}
							if (displaytext.length>2) vars.multiselecter.dialog.container.css({'width':(displaytext.length*200).toString()+'px'})
							vars.multiselecter.show({
								datasource:datasource,
								buttons:{
									ok:function(selection){
										var values=[];
										for (var i=0;i<selection.length;i++) values.push(selection[i][fieldinfo.lookup.relatedKeyField]);
										target.val(values.join(','));
										vars.multiselecter.hide();
									},
									cancel:function(){vars.multiselecter.hide();}
								},
								selected:(function(values){
									var res=[];
									for (var i=0;i<values.length;i++)
									{
										res.push({});
										res[i][fieldinfo.lookup.relatedKeyField]=values[i];
									}
									return res;
								})(target.val().split(','))
							});
						});
					})
				);
			});
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return event;
		if (!('settings' in vars.config)) return event;
		/* initialize valiable */
		vars.settings=JSON.parse(vars.config['settings']);
		/* get fields of app */
		kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
			vars.fieldinfos=$.fieldparallelize(resp.properties);
			/* setup buttons */
			for (var i=0;i<vars.settings.length;i++)
			{
				var setting=vars.settings[i];
				var tablecode=vars.fieldinfos[setting.lookup].tablecode;
				functions.setupbutton(setting);
				if (tablecode)
				{
					var events=[];
					events.push('app.record.create.change.'+tablecode);
					events.push('app.record.edit.change.'+tablecode);
					(function(setting,events){
						kintone.events.on(events,function(event){
							functions.setupbutton(setting);
							return event;
						});
					})(setting,events)
				}
			}
			vars.multiselecter=$('body').multiselect({ismulticells:true});
		},function(error){
			swal('Error!',error.message,'error');
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
