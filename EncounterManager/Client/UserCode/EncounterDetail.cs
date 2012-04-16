using System;
using System.Linq;
using Microsoft.LightSwitch.Details;
using Microsoft.LightSwitch.Details.Framework.Base;
using Microsoft.LightSwitch.Framework.Base;
using Microsoft.LightSwitch.Framework.Client;
using Microsoft.LightSwitch.Presentation.Extensions;
namespace LightSwitchApplication
{
    public partial class EncounterDetail
    {
        partial void Encounter_Loaded(bool succeeded)
        {
            // Write your code here.
            this.SetDisplayNameFromEntity(this.Encounter);
        }

        partial void Encounter_Changed()
        {
            // Write your code here.
            this.SetDisplayNameFromEntity(this.Encounter);
        }

        partial void EncounterDetail_Saved()
        {
            // Write your code here.
            this.SetDisplayNameFromEntity(this.Encounter);
        }

        partial void Clone_Execute()
        {
            // Find the highest index of the specified creature name
            int curIndex =
                Encounter.Creatures
                         .Where(c => String.Equals(c.Name, Creatures.SelectedItem.Name, StringComparison.OrdinalIgnoreCase))
                         .Max(c => c.Index);
            Creature newCreature = new Creature();
            CloneEntity(Creatures.SelectedItem.Details.Properties, newCreature.Details.Properties);
            newCreature.Index = curIndex + 1;
            newCreature.ResetHP();
            foreach (Power p in Creatures.SelectedItem.Powers)
            {
                var newPower = new Power();
                CloneEntity(p.Details.Properties, newPower.Details.Properties);
                newCreature.Powers.Add(newPower);
            }
            Encounter.Creatures.Add(newCreature);
            Creatures.SelectedItem = newCreature;
        }

        private void CloneEntity<T, TDetails>(EntityPropertySet<T, TDetails> src, EntityPropertySet<T, TDetails> dest)
            where T : EntityObject<T, TDetails>
            where TDetails : EntityDetails<T, TDetails>, new()
        {
            foreach(var pair in Enumerable.Zip(src.All().OrderBy(p => p.Name), dest.All().OrderBy(p => p.Name), (s, d) => Tuple.Create(s,d)))
            {
                if (String.Equals(pair.Item1.Name, pair.Item2.Name) && !pair.Item1.IsReadOnly && !(pair.Item1 is IEntityNavigationProperty))
                {
                    pair.Item2.Value = pair.Item1.Value;
                }
            }
        }

        partial void TakeDamage_Execute()
        {
            // Write your code here.
            TakeDamageAdd = false;
            TakeDamageLabel = "Take Damage";
            TakeDamageAmount = 0;
            this.OpenModalWindow("TakeDamageModal");
        }

        partial void Heal_Execute()
        {
            // Write your code here.
            TakeDamageAdd = false;
            TakeDamageLabel = "Heal";
            TakeDamageAmount = (int)Math.Floor(Creatures.SelectedItem.MaxHP / 4);
            this.OpenModalWindow("TakeDamageModal");
        }

        partial void OkMethod_Execute()
        {
            // Write your code here.
            if (TakeDamageAdd)
            {
                Creatures.SelectedItem.CurrentHP += TakeDamageAmount;
            }
            else
            {
                Creatures.SelectedItem.CurrentHP -= TakeDamageAmount;
            }
            this.CloseModalWindow("TakeDamageModal");
        }

        partial void CancelMethod_Execute()
        {
            // Write your code here.
            this.CloseModalWindow("TakeDamageModal");
        }
    }
}