using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.LightSwitch;
namespace LightSwitchApplication
{
    public partial class Encounter
    {
        partial void TotalXP_Compute(ref int result)
        {
            // Set result to the desired field value
            result = Creatures.Where(c => c.XP.HasValue).Sum(c => c.XP.Value);
        }
    }
}
