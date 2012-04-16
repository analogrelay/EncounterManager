using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Microsoft.LightSwitch;
namespace LightSwitchApplication
{
    public partial class Creature
    {
        partial void StatusSummary_Compute(ref string result)
        {
            // Set result to the desired field value
            result = String.Join(", ",
                (IsBloodied ? new[] { "Bloodied" } : Enumerable.Empty<string>()).Concat(
                Statuses.Select(s => s.Effect)));
        }

        public void ResetHP()
        {
            CurrentHP = MaxHP;
        }

        partial void BloodiedHP_Compute(ref int result)
        {
            result = (int)Math.Floor(MaxHP / 2);
        }

        partial void IsBloodied_Compute(ref bool result)
        {
            result = CurrentHP <= BloodiedHP;
        }

        partial void FullName_Compute(ref string result)
        {
            if (Index > 0)
            {
                result = String.Format("{0} ({1})", Name, Index);
            }
            else
            {
                result = Name;
            }
        }
    }
}
