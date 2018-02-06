(function($){
jQuery.extend({
	datecalc:function(from,to,base){
		if (!base) base=from;
		var fromdiff=from.getTime()-base.getTime();
		var todiff=to.getTime()-base.getTime();
		var basetime={
			hour:base.getHours(),
			minute:base.getMinutes()
		};
		var fromtime={
			day:fromdiff/(1000*60*60*24),
			hour:basetime.hour+Math.floor((basetime.minute+fromdiff/(1000*60))/60),
			minute:(basetime.minute+fromdiff/(1000*60))%60
		};
		var totime={
			day:todiff/(1000*60*60*24),
			hour:basetime.hour+Math.floor((basetime.minute+todiff/(1000*60))/60),
			minute:(basetime.minute+todiff/(1000*60))%60
		};
		var values={
			diffhours:Math.ceil((to.getTime()-from.getTime())/(1000*60*60)),
			diffminutes:Math.ceil((to.getTime()-from.getTime())/(1000*60)),
			passedhours:Math.floor((to.getTime()-from.getTime())/(1000*60*60)),
			passedminutes:Math.floor(((to.getTime()-from.getTime())/(1000*60))%60),
			from:fromtime,
			to:totime,
			formatfrom:('0'+fromtime.hour).slice(-2)+':'+('0'+fromtime.minute).slice(-2),
			formatto:('0'+totime.hour).slice(-2)+':'+('0'+totime.minute).slice(-2)
		};
		return values;
	},
	loademployees:function(config,fieldinfos,apps,offset,callback){
		var counter=0;
		var limit=500;
		var fieldinfo=fieldinfos[config['employee']];
		if (!('assignment' in apps)) apps['assignment']={};
		if (!('employee' in apps)) apps['employee']=[];
		if (!('employee' in offset)) offset['employee']=0;
		switch (fieldinfo.type)
		{
			case 'USER_SELECT':
				$.loadusers(function(records){
					counter=records.length;
					for (var i=0;i<records.length;i++)
					{
						var record={display:records[i].name,field:records[i].code,assignment:[]};
						if (config['assignment'].length!=0)
						{
							(function(record){
								switch (config['assignment'])
								{
									case '0':
										kintone.api(kintone.api.url('/v1/user/organizations',true),'GET',{code:record.field},function(resp){
											for (var i=0;i<resp.organizationTitles.length;i++) record.assignment.push(resp.organizationTitles[i].organization.code);
											counter--;
											if (counter==0) callback();
										},function(error){});
										break;
									case '1':
										kintone.api(kintone.api.url('/v1/user/groups',true),'GET',{code:record.field},function(resp){
											for (var i=0;i<resp.groups.length;i++) record.assignment.push(resp.groups[i].code);
											counter--;
											if (counter==0) callback();
										},function(error){});
										break;
								}
							})(record);
						}
						apps['employee'].push(record);
					}
					/* sort employee */
					apps['employee'].sort(function(a,b){
						if(a.field<b.field) return (config['employeesort']=='asc')?-1:1;
						if(a.field>b.field) return (config['employeesort']=='asc')?1:-1;
						return 0;
					});
					if (config['assignment'].length!=0)
					{
						switch (config['assignment'])
						{
							case '0':
								$.loadorganizations(function(records){
									for (var i=0;i<records.length;i++) apps['assignment'][records[i].code]=records[i].name;
									if (counter==0) callback();
								});
								break;
							case '1':
								$.loadgroups(function(records){
									for (var i=0;i<records.length;i++) apps['assignment'][records[i].code]=records[i].name;
									if (counter==0) callback();
								});
								break;
						}
					}
					else callback();
				});
				break;
			default:
				var body={
					app:fieldinfo.lookup.relatedApp.app,
					query:'order by '+fieldinfo.lookup.relatedKeyField+' '+config['employeesort']+' limit '+limit.toString()+' offset '+offset['employee'].toString()
				};
				kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
					$.each(resp.records,function(index,values){
						var record={display:values[config['employeedisplay']].value,field:values[fieldinfo.lookup.relatedKeyField].value,assignment:[]};
						if (config['assignment'].length!=0)
						{
							var assignment=values[config['assignment']].value;
							record.assignment.push(assignment);
							if (!(assignment in apps['assignment'])) apps['assignment'][assignment]=assignment;
						}
						apps['employee'].push(record);
					});
					offset['employee']+=limit;
					if (resp.records.length==limit) functions.loademployees(config,fieldinfos,apps,offset,callback);
					else callback();
				},function(error){});
				break;
		}
	}
});
})(jQuery);
